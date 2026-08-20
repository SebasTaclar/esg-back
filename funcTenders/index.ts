import { Context, HttpRequest } from '@azure/functions';
import { getTenderService } from '../src/shared/serviceProvider';
import { TenderRequest, UpdateTenderRequest, TenderServiceItem } from '../src/domain/entities/Tender';
import { withApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { validateAuthToken } from '../src/shared/authHelper';

const funcTenders = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger
): Promise<unknown> => {
  const tenderService = getTenderService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;

  if (method === 'GET' && !id) {
    logger.info('GET /tenders - Fetching all tenders');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;

    let result;
    if (search) {
      result = await tenderService.searchTenders(search, page, limit);
    } else {
      result = await tenderService.getAllTenders(page, limit);
    }

    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.tenders.length,
        tenders: result.tenders,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      search ? `Tenders found matching "${search}"` : 'Tenders retrieved successfully'
    );
  }

  if (method === 'GET' && id) {
    logger.info(`GET /tenders/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid tender ID');
    const tender = await tenderService.getTenderById(id);
    return ApiResponseBuilder.success(tender, 'Tender retrieved successfully');
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return ApiResponseBuilder.error('Unauthorized: Missing authorization header', 401);
  }
  try {
    validateAuthToken(authHeader);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logger.logError(`Authentication failed: ${errorMessage}`);
    return ApiResponseBuilder.error('Unauthorized: Invalid or expired token', 401);
  }

  if (method === 'POST') {
    logger.info('POST /tenders - Creating new tender');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.type) errors.push('type is required');
    if (!body.clientName) errors.push('clientName is required');
    if (!body.service) errors.push('service is required');
    if (!body.status) errors.push('status is required');
    if (!body.publicationDate) errors.push('publicationDate is required');
    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const tenderRequest: TenderRequest = {
      offerCode: body.offerCode as string,
      type: body.type as string,
      processNumber: body.processNumber as string,
      clientName: body.clientName as string,
      service: body.service as string,
      norm: body.norm as string,
      status: body.status as string,
      publicationDate: body.publicationDate as string,
      closingDate: body.closingDate as string,
      estimatedValue: body.estimatedValue as number,
      serviceItems: body.serviceItems as TenderServiceItem[],
      observations: body.observations as string,
    };

    const tender = await tenderService.createTender(tenderRequest);
    return { success: true, message: 'Tender created successfully', data: tender, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'PATCH' && id) {
    logger.info(`PATCH /tenders/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid tender ID');

    const body = req.body as Record<string, unknown>;
    const updateRequest: UpdateTenderRequest = {
      offerCode: body.offerCode as string,
      type: body.type as string,
      processNumber: body.processNumber as string,
      clientName: body.clientName as string,
      service: body.service as string,
      norm: body.norm as string,
      status: body.status as string,
      publicationDate: body.publicationDate as string,
      closingDate: body.closingDate as string,
      estimatedValue: body.estimatedValue as number,
      serviceItems: body.serviceItems as TenderServiceItem[],
      observations: body.observations as string,
    };

    const tender = await tenderService.updateTender(id, updateRequest);
    return ApiResponseBuilder.success(tender, 'Tender updated successfully');
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /tenders/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid tender ID');
    await tenderService.deleteTender(id);
    return ApiResponseBuilder.success({ id }, 'Tender deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withApiHandler(funcTenders);
