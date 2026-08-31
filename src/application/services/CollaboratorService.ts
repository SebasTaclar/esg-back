import { NotFoundError, ConflictError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { ICollaboratorDataSource } from '../../domain/interfaces/ICollaboratorDataSource';
import { Collaborator } from '@prisma/client';

export interface CollaboratorRequest {
  name: string;
  studies: string;
  mainArea: string;
  city: string;
  phone?: string;
  email?: string;
  status?: string;
  competencies?: unknown;
  documents?: unknown;
}

export interface CollaboratorResponse {
  id: number;
  name: string;
  studies: string;
  mainArea: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  competencies?: unknown;
  documents?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCollaboratorRequest {
  name?: string;
  studies?: string;
  mainArea?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
  competencies?: unknown;
  documents?: unknown;
}

function toCollaboratorResponse(collaborator: Collaborator): CollaboratorResponse {
  return {
    id: collaborator.id,
    name: collaborator.name,
    studies: collaborator.studies,
    mainArea: collaborator.mainArea,
    city: collaborator.city,
    phone: collaborator.phone,
    email: collaborator.email,
    status: collaborator.status,
    competencies: collaborator.competencies,
    documents: collaborator.documents,
    createdAt: collaborator.createdAt,
    updatedAt: collaborator.updatedAt,
  };
}

export class CollaboratorService {
  private logger: Logger;
  private collaboratorDataSource: ICollaboratorDataSource;

  constructor(logger: Logger, collaboratorDataSource: ICollaboratorDataSource) {
    this.logger = logger;
    this.collaboratorDataSource = collaboratorDataSource;
  }

  async createCollaborator(data: CollaboratorRequest): Promise<CollaboratorResponse> {
    this.logger.info(`Creating new collaborator with name: ${data.name}`);

    const collaborator = await this.collaboratorDataSource.create({
      name: data.name,
      studies: data.studies,
      mainArea: data.mainArea,
      city: data.city,
      phone: data.phone,
      email: data.email,
      status: data.status,
      competencies: data.competencies,
      documents: data.documents,
    });

    this.logger.info(`Collaborator created with ID: ${collaborator.id}`);
    return toCollaboratorResponse(collaborator);
  }

  async getAllCollaborators(
    page?: number,
    limit?: number
  ): Promise<{ collaborators: CollaboratorResponse[]; total: number }> {
    this.logger.info(`Fetching all collaborators - Page: ${page || 'all'}, Limit: ${limit || 'all'}`);

    const result = await this.collaboratorDataSource.getAll(page, limit);
    return {
      collaborators: result.collaborators.map(toCollaboratorResponse),
      total: result.total,
    };
  }

  async getCollaboratorById(id: number): Promise<CollaboratorResponse> {
    this.logger.info(`Fetching collaborator by ID: ${id}`);

    const collaborator = await this.collaboratorDataSource.getById(id);
    if (!collaborator) {
      throw new NotFoundError(`Collaborator with ID ${id} not found`);
    }

    return toCollaboratorResponse(collaborator);
  }

  async updateCollaborator(id: number, data: UpdateCollaboratorRequest): Promise<CollaboratorResponse> {
    this.logger.info(`Updating collaborator with ID: ${id}`);

    const existingCollaborator = await this.collaboratorDataSource.getById(id);
    if (!existingCollaborator) {
      throw new NotFoundError(`Collaborator with ID ${id} not found`);
    }

    await this.collaboratorDataSource.update(id, data);

    this.logger.info(`Collaborator ${id} updated successfully`);
    return this.getCollaboratorById(id);
  }

  async deleteCollaborator(id: number): Promise<void> {
    this.logger.info(`Deleting collaborator with ID: ${id}`);

    const existingCollaborator = await this.collaboratorDataSource.getById(id);
    if (!existingCollaborator) {
      throw new NotFoundError(`Collaborator with ID ${id} not found`);
    }

    await this.collaboratorDataSource.delete(id);
    this.logger.info(`Collaborator ${id} deleted successfully`);
  }

  async searchCollaborators(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ collaborators: CollaboratorResponse[]; total: number }> {
    this.logger.info(`Searching collaborators with query: ${query}`);

    const result = await this.collaboratorDataSource.search(query, page, limit);
    return {
      collaborators: result.collaborators.map(toCollaboratorResponse),
      total: result.total,
    };
  }
}
