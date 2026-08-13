import { NotFoundError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IEventDataSource } from '../../domain/interfaces/IEventDataSource';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { IProjectDataSource } from '../../domain/interfaces/IProjectDataSource';
import { IQuoteDataSource } from '../../domain/interfaces/IQuoteDataSource';
import { ITenderDataSource } from '../../domain/interfaces/ITenderDataSource';
import { EventRequest, EventResponse } from '../../domain/entities/Event';
import { Event } from '@prisma/client';

const ENTITY_LABELS: Record<string, string> = {
  client: 'Client',
  project: 'Project',
  quote: 'Quote',
  tender: 'Tender',
};

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
  private clientDataSource: IClientDataSource;
  private projectDataSource: IProjectDataSource;
  private quoteDataSource: IQuoteDataSource;
  private tenderDataSource: ITenderDataSource;

  constructor(
    logger: Logger,
    eventDataSource: IEventDataSource,
    clientDataSource: IClientDataSource,
    projectDataSource: IProjectDataSource,
    quoteDataSource: IQuoteDataSource,
    tenderDataSource: ITenderDataSource
  ) {
    this.logger = logger;
    this.eventDataSource = eventDataSource;
    this.clientDataSource = clientDataSource;
    this.projectDataSource = projectDataSource;
    this.quoteDataSource = quoteDataSource;
    this.tenderDataSource = tenderDataSource;
  }

  private async validateEntityExists(entityType: string, entityId: number): Promise<void> {
    let exists = false;

    switch (entityType) {
      case 'client': {
        const entity = await this.clientDataSource.getById(entityId);
        exists = entity !== null;
        break;
      }
      case 'project': {
        const entity = await this.projectDataSource.getById(entityId);
        exists = entity !== null;
        break;
      }
      case 'quote': {
        const entity = await this.quoteDataSource.getById(entityId);
        exists = entity !== null;
        break;
      }
      case 'tender': {
        const entity = await this.tenderDataSource.getById(entityId);
        exists = entity !== null;
        break;
      }
      default:
        throw new NotFoundError(`Invalid entity type: ${entityType}`);
    }

    if (!exists) {
      const label = ENTITY_LABELS[entityType] || entityType;
      throw new NotFoundError(`${label} with ID ${entityId} not found`);
    }
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

    await this.validateEntityExists(request.entityType, request.entityId);

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
