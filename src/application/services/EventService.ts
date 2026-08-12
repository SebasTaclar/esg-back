import { NotFoundError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IEventDataSource } from '../../domain/interfaces/IEventDataSource';
import { EventRequest, EventResponse } from '../../domain/entities/Event';
import { Event } from '@prisma/client';

function toEventResponse(event: Event): EventResponse {
  return {
    id: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    type: event.type,
    description: event.description,
    user: event.user,
    date: event.date,
    createdAt: event.createdAt,
  };
}

export class EventService {
  private logger: Logger;
  private eventDataSource: IEventDataSource;

  constructor(logger: Logger, eventDataSource: IEventDataSource) {
    this.logger = logger;
    this.eventDataSource = eventDataSource;
  }

  async getAllEvents(
    page?: number,
    limit?: number
  ): Promise<{ events: EventResponse[]; total: number }> {
    this.logger.info(`Fetching all events`);

    const result = await this.eventDataSource.getAll(page, limit);
    return {
      events: result.events.map(toEventResponse),
      total: result.total,
    };
  }

  async getEventsByEntity(entityType: string, entityId: number): Promise<EventResponse[]> {
    this.logger.info(`Fetching events for ${entityType}/${entityId}`);

    const events = await this.eventDataSource.getByEntity(entityType, entityId);
    return events.map(toEventResponse);
  }

  async createEvent(request: EventRequest): Promise<EventResponse> {
    this.logger.info(`Creating event for ${request.entityType}/${request.entityId}`);

    const event = await this.eventDataSource.create({
      entityType: request.entityType,
      entityId: request.entityId,
      type: request.type,
      description: request.description,
      user: request.user,
      date: request.date,
    });

    this.logger.info(`Event created with ID: ${event.id}`);
    return toEventResponse(event);
  }

  async deleteEvent(id: number): Promise<void> {
    this.logger.info(`Deleting event ${id}`);

    await this.eventDataSource.delete(id);
    this.logger.info(`Event ${id} deleted successfully`);
  }
}
