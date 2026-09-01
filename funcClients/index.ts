import { Context, HttpRequest } from '@azure/functions';
import { getClientService } from '../src/shared/serviceProvider';
import { ClientRequest, UpdateClientRequest } from '../src/application/services/ClientService';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { isAdmin, isClient } from '../src/shared/roleMiddleware';

const funcClients = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const clientService = getClientService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;

  if (method === 'GET' && !id) {
    logger.info('GET /clients - Fetching clients');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    let result;

    if (isClient(user)) {
      const userClients = await clientService.getClientsByUserId(parseInt(user.id, 10));
      result = { clients: userClients, total: userClients.length };
    } else if (search) {
      result = await clientService.searchClients(search, page || 1, limit || 10);
    } else if (page || limit) {
      result = await clientService.getAllClients(page || 1, limit || 10);
    } else {
      result = await clientService.getAllClients();
    }

    const effectiveLimit = limit || result.total;
    const effectivePage = page || 1;
    const totalPages = Math.ceil(result.total / effectiveLimit);

    return ApiResponseBuilder.success(
      {
        count: result.clients.length,
        clients: result.clients,
        pagination: limit || page ? {
          page: effectivePage,
          limit: effectiveLimit,
          total: result.total,
          totalPages,
          hasNext: effectivePage < totalPages,
          hasPrevious: effectivePage > 1,
        } : undefined,
      },
      search ? `Clients found matching "${search}"` : 'Clients retrieved successfully'
    );
  }

  if (method === 'GET' && id) {
    logger.info(`GET /clients/${id} - Fetching client by ID`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid client ID');
    const client = await clientService.getClientById(id);

    if (isClient(user) && client.userId !== parseInt(user.id, 10)) {
      return ApiResponseBuilder.error('Forbidden: You can only view your own clients', 403);
    }

    return ApiResponseBuilder.success(client, 'Client retrieved successfully');
  }

  if (method === 'POST') {
    logger.info('POST /clients - Creating new client');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.name) errors.push('name is required');
    if (!body.nit) errors.push('nit is required');
    if (!body.email) errors.push('email is required');
    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const clientRequest: ClientRequest = {
      name: body.name as string,
      nit: body.nit as string,
      code: body.code as string,
      organizationType: body.organizationType as string,
      norm: body.norm as string,
      city: body.city as string,
      department: body.department as string,
      address: body.address as string,
      phone: body.phone as string,
      email: body.email as string,
      website: body.website as string,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      isProspect: body.isProspect !== undefined ? Boolean(body.isProspect) : undefined,
      observations: body.observations as string,
      showResources: body.showResources !== undefined ? Boolean(body.showResources) : undefined,
      contacts: body.contacts as ClientRequest['contacts'],
      resources: body.resources as ClientRequest['resources'],
      userId: isAdmin(user) ? (body.userId as number) : undefined,
    };

    const client = await clientService.createClient(clientRequest);
    return { success: true, message: 'Client created successfully', data: client, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'PATCH' && id) {
    logger.info(`PATCH /clients/${id} - Updating client`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid client ID');

    const existingClient = await clientService.getClientById(id);
    if (isClient(user) && existingClient.userId !== parseInt(user.id, 10)) {
      return ApiResponseBuilder.error('Forbidden: You can only update your own clients', 403);
    }

    const body = req.body as Record<string, unknown>;
    const updateRequest: UpdateClientRequest = {
      name: body.name as string,
      nit: body.nit as string,
      code: body.code as string,
      organizationType: body.organizationType as string,
      norm: body.norm as string,
      city: body.city as string,
      department: body.department as string,
      address: body.address as string,
      phone: body.phone as string,
      email: body.email as string,
      website: body.website as string,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      isProspect: body.isProspect !== undefined ? Boolean(body.isProspect) : undefined,
      observations: body.observations as string,
      showResources: body.showResources !== undefined ? Boolean(body.showResources) : undefined,
      contacts: body.contacts as UpdateClientRequest['contacts'],
      resources: body.resources as UpdateClientRequest['resources'],
    };

    const client = await clientService.updateClient(id, updateRequest);
    return ApiResponseBuilder.success(client, 'Client updated successfully');
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /clients/${id} - Deleting client`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid client ID');

    const existingClient = await clientService.getClientById(id);
    if (isClient(user) && existingClient.userId !== parseInt(user.id, 10)) {
      return ApiResponseBuilder.error('Forbidden: You can only delete your own clients', 403);
    }

    await clientService.deleteClient(id);
    return ApiResponseBuilder.success({ id }, 'Client deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withAuthenticatedApiHandler(funcClients);
