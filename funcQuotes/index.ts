import { Context, HttpRequest } from '@azure/functions';
import { getQuoteService } from '../src/shared/serviceProvider';
import { QuoteRequest, UpdateQuoteRequest } from '../src/application/services/QuoteService';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { isAdmin, isClient } from '../src/shared/roleMiddleware';

const funcQuotes = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const quoteService = getQuoteService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;
  const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : null;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : null;

  if (method === 'GET' && !id && !clientId && !projectId) {
    logger.info('GET /quotes - Fetching all quotes');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;

    let result;
    if (search) {
      result = await quoteService.searchQuotes(search, page, limit);
    } else {
      result = await quoteService.getAllQuotes(page, limit);
    }

    if (isClient(user)) {
      result.quotes = result.quotes.filter(q => q.isVisible);
    }

    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.quotes.length,
        quotes: result.quotes,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      search ? `Quotes found matching "${search}"` : 'Quotes retrieved successfully'
    );
  }

  if (method === 'GET' && !id && clientId) {
    logger.info(`GET /quotes?clientId=${clientId}`);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (isNaN(clientId)) return ApiResponseBuilder.badRequest('Invalid client ID');

    const result = await quoteService.getQuotesByClientId(clientId, page, limit);

    if (isClient(user)) {
      result.quotes = result.quotes.filter(q => q.isVisible);
    }

    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.quotes.length,
        quotes: result.quotes,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      'Client quotes retrieved successfully'
    );
  }

  if (method === 'GET' && !id && projectId) {
    logger.info(`GET /quotes?projectId=${projectId}`);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (isNaN(projectId)) return ApiResponseBuilder.badRequest('Invalid project ID');

    const result = await quoteService.getQuotesByProjectId(projectId, page, limit);

    if (isClient(user)) {
      result.quotes = result.quotes.filter(q => q.isVisible);
    }

    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.quotes.length,
        quotes: result.quotes,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      'Project quotes retrieved successfully'
    );
  }

  if (method === 'GET' && id) {
    logger.info(`GET /quotes/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid quote ID');
    const quote = await quoteService.getQuoteById(id);

    if (isClient(user) && !quote.isVisible) {
      return ApiResponseBuilder.error('Forbidden: This quote is not visible', 403);
    }

    return ApiResponseBuilder.success(quote, 'Quote retrieved successfully');
  }

  if (method === 'POST') {
    logger.info('POST /quotes - Creating new quote');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.services || !Array.isArray(body.services) || body.services.length === 0) {
      errors.push('services array is required and must contain at least one service');
    }

    if (body.services && Array.isArray(body.services)) {
      body.services.forEach((service: Record<string, unknown>, index: number) => {
        if (!service.name) errors.push(`services[${index}].name is required`);
        if (service.quantity === undefined || (service.quantity as number) <= 0) errors.push(`services[${index}].quantity must be greater than 0`);
        if (!service.billingType) errors.push(`services[${index}].billingType is required`);
        if (service.value === undefined || (service.value as number) <= 0) errors.push(`services[${index}].value must be greater than 0`);
      });
    }

    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const quoteRequest: QuoteRequest = {
      code: body.code as string,
      clientId: body.clientId as number,
      clientName: body.clientName as string,
      projectId: body.projectId as number,
      status: body.status as string,
      totalAmount: body.totalAmount as number,
      validUntil: body.validUntil as string,
      observations: body.observations as string,
      services: body.services as QuoteRequest['services'],
      isVisible: body.isVisible as boolean,
    };

    const quote = await quoteService.createQuote(quoteRequest);
    return { success: true, message: 'Quote created successfully', data: quote, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'PATCH' && id) {
    logger.info(`PATCH /quotes/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid quote ID');

    const body = req.body as Record<string, unknown>;
    const updateRequest: UpdateQuoteRequest = {
      code: body.code as string,
      clientId: body.clientId as number,
      clientName: body.clientName as string,
      projectId: body.projectId as number,
      status: body.status as string,
      totalAmount: body.totalAmount as number,
      validUntil: body.validUntil as string,
      observations: body.observations as string,
      services: body.services as UpdateQuoteRequest['services'],
      isVisible: body.isVisible as boolean,
    };

    const quote = await quoteService.updateQuote(id, updateRequest);
    return ApiResponseBuilder.success(quote, 'Quote updated successfully');
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /quotes/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid quote ID');
    await quoteService.deleteQuote(id);
    return ApiResponseBuilder.success({ id }, 'Quote deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withAuthenticatedApiHandler(funcQuotes);
