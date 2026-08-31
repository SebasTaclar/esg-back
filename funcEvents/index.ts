import { Context, HttpRequest } from '@azure/functions';
import { getEventService } from '../src/shared/serviceProvider';
import { EventRequest } from '../src/domain/entities/Event';
import { withApiHandler } from '../src/shared/apiHandler';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { validateAuthToken } from '../src/shared/authHelper';

const funcEvents = async (
  _context: Context,
  req: HttpRequest,
  logger: Logger
): Promise<unknown> => {
  const eventService = getEventService(logger);
  const method = req.method?.toUpperCase();
  const id = req.params.id ? parseInt(req.params.id, 10) : null;
  const entityType = req.query.entityType as string | undefined;
  const entityId = req.query.entityId ? parseInt(req.query.entityId as string, 10) : null;

  if (method === 'GET' && !id && entityType && entityId) {
    logger.info(`GET /events?entityType=${entityType}&entityId=${entityId}`);
    const events = await eventService.getEventsByEntity(entityType, entityId);
    return ApiResponseBuilder.success({ count: events.length, events }, 'Events retrieved successfully');
  }

  if (method === 'GET' && !id) {
    logger.info('GET /events - Fetching all events');
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = await eventService.getAllEvents(page, limit);
    const totalPages = Math.ceil(result.total / limit);
    return ApiResponseBuilder.success(
      {
        count: result.events.length,
        events: result.events,
        pagination: { page, limit, total: result.total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
      'Events retrieved successfully'
    );
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
    logger.info('POST /events - Creating new event');
    const body = req.body as Record<string, unknown>;

    const errors: string[] = [];
    if (!body.type) errors.push('type is required');
    if (!body.date) errors.push('date is required');
    if (!body.user) errors.push('user is required');
    if (errors.length > 0) return ApiResponseBuilder.validationError(errors);

    const eventRequest: EventRequest = {
      entityType: body.entityType as EventRequest['entityType'],
      entityId: body.entityId as number,
      title: body.title as string,
      client: body.client as string,
      type: body.type as string,
      typeOtro: body.typeOtro as string,
      description: body.description as string,
      date: body.date as string,
      endDate: body.endDate as string,
      modalidad: body.modalidad as string,
      modalidadOtro: body.modalidadOtro as string,
      location: body.location as string,
      personaContacto: body.personaContacto as string,
      user: body.user as string,
      userOtro: body.userOtro as string,
      leadAuditor: body.leadAuditor as string,
      coAuditors: body.coAuditors as string,
      normas: body.normas as string,
    };

    const event = await eventService.createEvent(eventRequest);
    return { success: true, message: 'Event created successfully', data: event, timestamp: new Date().toISOString(), statusCode: 201 };
  }

  if (method === 'DELETE' && id) {
    logger.info(`DELETE /events/${id}`);
    if (isNaN(id)) return ApiResponseBuilder.badRequest('Invalid event ID');
    await eventService.deleteEvent(id);
    return ApiResponseBuilder.success({ id }, 'Event deleted successfully');
  }

  return ApiResponseBuilder.methodNotAllowed(`Method ${method} not allowed for this endpoint`);
};

export default withApiHandler(funcEvents);
