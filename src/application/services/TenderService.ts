import { NotFoundError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { ITenderDataSource } from '../../domain/interfaces/ITenderDataSource';
import { TenderRequest, TenderResponse, UpdateTenderRequest, TenderServiceItem } from '../../domain/entities/Tender';
import { Tender } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toTenderResponse(tender: Tender): TenderResponse {
  return {
    id: tender.id,
    offerCode: tender.offerCode,
    type: tender.type,
    processNumber: tender.processNumber,
    clientName: tender.clientName,
    service: tender.service,
    norm: tender.norm,
    status: tender.status,
    publicationDate: tender.publicationDate,
    closingDate: tender.closingDate,
    estimatedValue: tender.estimatedValue,
    serviceItems: tender.serviceItems as TenderServiceItem[] | null,
    observations: tender.observations,
    createdAt: tender.createdAt,
    updatedAt: tender.updatedAt,
  };
}

export class TenderService {
  private logger: Logger;
  private tenderDataSource: ITenderDataSource;

  constructor(logger: Logger, tenderDataSource: ITenderDataSource) {
    this.logger = logger;
    this.tenderDataSource = tenderDataSource;
  }

  async getAllTenders(
    page?: number,
    limit?: number
  ): Promise<{ tenders: TenderResponse[]; total: number }> {
    this.logger.info(`Fetching all tenders`);

    const result = await this.tenderDataSource.getAll(page, limit);
    return {
      tenders: result.tenders.map(toTenderResponse),
      total: result.total,
    };
  }

  async getTenderById(id: number): Promise<TenderResponse> {
    this.logger.info(`Fetching tender by ID: ${id}`);

    const tender = await this.tenderDataSource.getById(id);
    if (!tender) {
      throw new NotFoundError(`Tender with ID ${id} not found`);
    }

    return toTenderResponse(tender);
  }

  async createTender(request: TenderRequest): Promise<TenderResponse> {
    this.logger.info(`Creating tender for ${request.clientName}`);

    const tender = await this.tenderDataSource.create({
      offerCode: request.offerCode,
      type: request.type,
      processNumber: request.processNumber,
      clientName: request.clientName,
      service: request.service,
      norm: request.norm,
      status: request.status,
      publicationDate: request.publicationDate,
      closingDate: request.closingDate,
      estimatedValue: request.estimatedValue,
      serviceItems: request.serviceItems,
      observations: request.observations,
    });

    this.logger.info(`Tender created with ID: ${tender.id}`);
    return toTenderResponse(tender);
  }

  async updateTender(id: number, request: UpdateTenderRequest): Promise<TenderResponse> {
    this.logger.info(`Updating tender ${id}`);

    const existingTender = await this.tenderDataSource.getById(id);
    if (!existingTender) {
      throw new NotFoundError(`Tender with ID ${id} not found`);
    }

    const updatedTender = await this.tenderDataSource.update(id, {
      offerCode: request.offerCode,
      type: request.type,
      processNumber: request.processNumber,
      clientName: request.clientName,
      service: request.service,
      norm: request.norm,
      status: request.status,
      publicationDate: request.publicationDate,
      closingDate: request.closingDate,
      estimatedValue: request.estimatedValue,
      serviceItems: request.serviceItems,
      observations: request.observations,
    });

    this.logger.info(`Tender ${id} updated successfully`);
    return toTenderResponse(updatedTender);
  }

  async deleteTender(id: number): Promise<void> {
    this.logger.info(`Deleting tender ${id}`);

    const existingTender = await this.tenderDataSource.getById(id);
    if (!existingTender) {
      throw new NotFoundError(`Tender with ID ${id} not found`);
    }

    await this.tenderDataSource.delete(id);
    this.logger.info(`Tender ${id} deleted successfully`);
  }

  async searchTenders(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ tenders: TenderResponse[]; total: number }> {
    this.logger.info(`Searching tenders with query: ${query}`);

    const result = await this.tenderDataSource.search(query, page, limit);
    return {
      tenders: result.tenders.map(toTenderResponse),
      total: result.total,
    };
  }
}
