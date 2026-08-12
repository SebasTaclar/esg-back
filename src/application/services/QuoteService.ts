import { NotFoundError, ConflictError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IQuoteDataSource, QuoteService as QuoteServiceType } from '../../domain/interfaces/IQuoteDataSource';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { IProjectDataSource } from '../../domain/interfaces/IProjectDataSource';
import { Decimal } from '@prisma/client/runtime/library';

export interface QuoteRequest {
  code?: string;
  clientId: number;
  projectId?: number;
  status?: string;
  totalAmount: number;
  validUntil?: string;
  observations?: string;
  services: QuoteServiceType[];
}

export interface QuoteResponse {
  id: number;
  code?: string | null;
  clientId: number;
  client?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    nit: string;
  };
  projectId?: number | null;
  project?: {
    id: number;
    code: string;
    description: string;
  } | null;
  status: string;
  totalAmount: Decimal | number;
  validUntil?: Date | null;
  observations?: string | null;
  services: QuoteServiceType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateQuoteRequest {
  code?: string;
  clientId?: number;
  projectId?: number;
  status?: string;
  totalAmount?: number;
  validUntil?: string;
  observations?: string;
  services?: QuoteServiceType[];
}

export class QuoteService {
  private logger: Logger;
  private quoteDataSource: IQuoteDataSource;
  private clientDataSource: IClientDataSource;
  private projectDataSource?: IProjectDataSource;

  constructor(
    logger: Logger,
    quoteDataSource: IQuoteDataSource,
    clientDataSource: IClientDataSource,
    projectDataSource?: IProjectDataSource
  ) {
    this.logger = logger;
    this.quoteDataSource = quoteDataSource;
    this.clientDataSource = clientDataSource;
    this.projectDataSource = projectDataSource;
  }

  async getAllQuotes(page: number = 1, limit: number = 10): Promise<{ quotes: QuoteResponse[]; total: number }> {
    this.logger.info(`Fetching all quotes - Page: ${page}, Limit: ${limit}`);
    const result = await this.quoteDataSource.getAll(page, limit);
    return result as unknown as { quotes: QuoteResponse[]; total: number };
  }

  async getQuotesByClientId(clientId: number, page: number = 1, limit: number = 10): Promise<{ quotes: QuoteResponse[]; total: number }> {
    this.logger.info(`Fetching quotes for client ${clientId}`);
    const result = await this.quoteDataSource.getByClientId(clientId, page, limit);
    return result as unknown as { quotes: QuoteResponse[]; total: number };
  }

  async getQuotesByProjectId(projectId: number, page: number = 1, limit: number = 10): Promise<{ quotes: QuoteResponse[]; total: number }> {
    this.logger.info(`Fetching quotes for project ${projectId}`);
    const result = await this.quoteDataSource.getByProjectId(projectId, page, limit);
    return result as unknown as { quotes: QuoteResponse[]; total: number };
  }

  async getQuoteById(id: number): Promise<QuoteResponse> {
    this.logger.info(`Fetching quote ${id}`);
    const quote = await this.quoteDataSource.getById(id);
    if (!quote) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }
    return quote as unknown as QuoteResponse;
  }

  async createQuote(request: QuoteRequest): Promise<QuoteResponse> {
    this.logger.info(`Creating quote for client ${request.clientId}`);

    const client = await this.clientDataSource.getById(request.clientId);
    if (!client) {
      throw new NotFoundError(`Client with ID ${request.clientId} not found`);
    }

    if (request.projectId && this.projectDataSource) {
      const project = await this.projectDataSource.getById(request.projectId);
      if (!project) {
        throw new NotFoundError(`Project with ID ${request.projectId} not found`);
      }
    }

    if (!request.services || request.services.length === 0) {
      throw new ConflictError('At least one service is required');
    }

    const totalAmount = request.services.reduce((sum, service) => {
      return sum + service.value * service.quantity;
    }, 0);

    const quote = await this.quoteDataSource.create({
      code: request.code,
      clientId: request.clientId,
      projectId: request.projectId,
      status: request.status,
      totalAmount: request.totalAmount || totalAmount,
      validUntil: request.validUntil,
      observations: request.observations,
      services: request.services,
    });

    this.logger.info(`Quote ${quote.id} created successfully`);
    return quote as unknown as QuoteResponse;
  }

  async updateQuote(id: number, request: UpdateQuoteRequest): Promise<QuoteResponse> {
    this.logger.info(`Updating quote ${id}`);

    const existingQuote = await this.quoteDataSource.getById(id);
    if (!existingQuote) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }

    if (request.projectId && this.projectDataSource) {
      const project = await this.projectDataSource.getById(request.projectId);
      if (!project) {
        throw new NotFoundError(`Project with ID ${request.projectId} not found`);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (request.code !== undefined) updateData.code = request.code;
    if (request.clientId !== undefined) updateData.clientId = request.clientId;
    if (request.projectId !== undefined) updateData.projectId = request.projectId;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.validUntil !== undefined) updateData.validUntil = request.validUntil;
    if (request.observations !== undefined) updateData.observations = request.observations;

    if (request.services) {
      if (request.services.length === 0) {
        throw new ConflictError('At least one service is required');
      }
      updateData.services = request.services;
      if (!request.totalAmount) {
        updateData.totalAmount = request.services.reduce((sum, service) => {
          return sum + service.value * service.quantity;
        }, 0);
      }
    }

    if (request.totalAmount !== undefined) {
      updateData.totalAmount = request.totalAmount;
    }

    const updatedQuote = await this.quoteDataSource.update(id, updateData as { services?: QuoteServiceType[]; totalAmount?: number; code?: string; clientId?: number; projectId?: number; status?: string; validUntil?: string; observations?: string });

    this.logger.info(`Quote ${id} updated successfully`);
    return updatedQuote as unknown as QuoteResponse;
  }

  async deleteQuote(id: number): Promise<void> {
    this.logger.info(`Deleting quote ${id}`);

    const existingQuote = await this.quoteDataSource.getById(id);
    if (!existingQuote) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }

    await this.quoteDataSource.delete(id);
    this.logger.info(`Quote ${id} deleted successfully`);
  }

  async searchQuotes(query: string, page: number = 1, limit: number = 10): Promise<{ quotes: QuoteResponse[]; total: number }> {
    this.logger.info(`Searching quotes with query: ${query}`);
    const result = await this.quoteDataSource.search(query, page, limit);
    return result as unknown as { quotes: QuoteResponse[]; total: number };
  }
}
