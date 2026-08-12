import { Context, HttpRequest } from '@azure/functions';
import { getProjectService } from '../src/shared/serviceProvider';
import { ProjectRequest, UpdateProjectRequest } from '../src/domain/entities/Project';
import { withApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { validateAuthToken } from '../src/shared/authHelper';

const funcProjects = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger
): Promise<unknown> => {
  const projectService = getProjectService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;
  const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : null;

  if (method === 'GET' && !id && !clientId) {
    logger.info('GET /projects - Fetching all projects');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;

    let result;
    if (search) {
      result = await projectService.searchProjects(search, page, limit);
    } else {
      result = await projectService.getAllProjects(page, limit);
    }

    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.projects.length,
        projects: result.projects,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      search ? `Projects found matching "${search}"` : 'Projects retrieved successfully'
    );
  }

  if (method === 'GET' && !id && clientId) {
    logger.info(`GET /projects?clientId=${clientId}`);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (isNaN(clientId)) {
      return ApiResponseBuilder.badRequest('Invalid client ID');
    }

    const result = await projectService.getProjectsByClientId(clientId, page, limit);
    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.projects.length,
        projects: result.projects,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      'Client projects retrieved successfully'
    );
  }

  if (method === 'GET' && id) {
    logger.info(`GET /projects/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid project ID');
    const project = await projectService.getProjectById(id);
    return ApiResponseBuilder.success(project, 'Project retrieved successfully');
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
    logger.info('POST /projects - Creating new project');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.clientId) errors.push('clientId is required');
    if (!body.code) errors.push('code is required');
    if (!body.status) errors.push('status is required');
    if (!body.responsible) errors.push('responsible is required');
    if (!body.startDate) errors.push('startDate is required');
    if (!body.description) errors.push('description is required');
    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const projectRequest: ProjectRequest = {
      clientId: body.clientId as number,
      consecutive: body.consecutive as number,
      abbreviation: body.abbreviation as string,
      code: body.code as string,
      projectType: body.projectType as string,
      serviceType: body.serviceType as string,
      norm: body.norm as string,
      status: body.status as string,
      responsible: body.responsible as string,
      startDate: body.startDate as string,
      endDate: body.endDate as string,
      description: body.description as string,
      observations: body.observations as string,
      offer: body.offer as string,
      totalCost: body.totalCost as number,
      services: body.services as ProjectRequest['services'],
    };

    const project = await projectService.createProject(projectRequest);
    return { success: true, message: 'Project created successfully', data: project, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'PATCH' && id) {
    logger.info(`PATCH /projects/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid project ID');

    const body = req.body as Record<string, unknown>;
    const updateRequest: UpdateProjectRequest = {
      consecutive: body.consecutive as number,
      abbreviation: body.abbreviation as string,
      code: body.code as string,
      clientId: body.clientId as number,
      projectType: body.projectType as string,
      serviceType: body.serviceType as string,
      norm: body.norm as string,
      status: body.status as string,
      responsible: body.responsible as string,
      startDate: body.startDate as string,
      endDate: body.endDate as string,
      description: body.description as string,
      observations: body.observations as string,
      offer: body.offer as string,
      totalCost: body.totalCost as number,
      services: body.services as UpdateProjectRequest['services'],
    };

    const project = await projectService.updateProject(id, updateRequest);
    return ApiResponseBuilder.success(project, 'Project updated successfully');
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /projects/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid project ID');
    await projectService.deleteProject(id);
    return ApiResponseBuilder.success({ id }, 'Project deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withApiHandler(funcProjects);
