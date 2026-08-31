import { Context, HttpRequest } from '@azure/functions';
import { getCollaboratorService } from '../src/shared/serviceProvider';
import { CollaboratorRequest, UpdateCollaboratorRequest } from '../src/application/services/CollaboratorService';
import { withApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { validateAuthToken } from '../src/shared/authHelper';

const funcCollaborators = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger
): Promise<unknown> => {
  const collaboratorService = getCollaboratorService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;

  if (method === 'GET' && !id) {
    logger.info('GET /collaborators - Fetching all collaborators');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    let result;
    if (search) {
      result = await collaboratorService.searchCollaborators(search, page || 1, limit || 10);
    } else if (page || limit) {
      result = await collaboratorService.getAllCollaborators(page || 1, limit || 10);
    } else {
      result = await collaboratorService.getAllCollaborators();
    }

    const effectiveLimit = limit || result.total;
    const effectivePage = page || 1;
    const totalPages = Math.ceil(result.total / effectiveLimit);

    return ApiResponseBuilder.success(
      {
        count: result.collaborators.length,
        collaborators: result.collaborators,
        pagination: limit || page ? {
          page: effectivePage,
          limit: effectiveLimit,
          total: result.total,
          totalPages,
          hasNext: effectivePage < totalPages,
          hasPrevious: effectivePage > 1,
        } : undefined,
      },
      search ? `Collaborators found matching "${search}"` : 'Collaborators retrieved successfully'
    );
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return ApiResponseBuilder.error('Unauthorized: Missing authorization header', 401);
  }
  try {
    validateAuthToken(authHeader);
    logger.logInfo(`User authenticated`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logger.logError(`Authentication failed: ${errorMessage}`);
    return ApiResponseBuilder.error('Unauthorized: Invalid or expired token', 401);
  }

  if (method === 'GET' && id) {
    logger.info(`GET /collaborators/${id} - Fetching collaborator by ID`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid collaborator ID');
    const collaborator = await collaboratorService.getCollaboratorById(id);
    return ApiResponseBuilder.success(collaborator, 'Collaborator retrieved successfully');
  }

  if (method === 'POST') {
    logger.info('POST /collaborators - Creating new collaborator');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.name) errors.push('name is required');
    if (!body.studies) errors.push('studies is required');
    if (!body.mainArea) errors.push('mainArea is required');
    if (!body.city) errors.push('city is required');
    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const collaboratorRequest: CollaboratorRequest = {
      name: body.name as string,
      studies: body.studies as string,
      mainArea: body.mainArea as string,
      city: body.city as string,
      phone: body.phone as string,
      email: body.email as string,
      status: body.status as string,
      competencies: body.competencies,
      documents: body.documents,
    };

    const collaborator = await collaboratorService.createCollaborator(collaboratorRequest);
    return { success: true, message: 'Collaborator created successfully', data: collaborator, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'PATCH' && id) {
    logger.info(`PATCH /collaborators/${id} - Updating collaborator`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid collaborator ID');

    const body = req.body as Record<string, unknown>;
    const updateRequest: UpdateCollaboratorRequest = {
      name: body.name as string,
      studies: body.studies as string,
      mainArea: body.mainArea as string,
      city: body.city as string,
      phone: body.phone as string,
      email: body.email as string,
      status: body.status as string,
      competencies: body.competencies,
      documents: body.documents,
    };

    const collaborator = await collaboratorService.updateCollaborator(id, updateRequest);
    return ApiResponseBuilder.success(collaborator, 'Collaborator updated successfully');
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /collaborators/${id} - Deleting collaborator`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid collaborator ID');
    await collaboratorService.deleteCollaborator(id);
    return ApiResponseBuilder.success({ id }, 'Collaborator deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withApiHandler(funcCollaborators);
