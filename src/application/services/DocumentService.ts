import { NotFoundError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IDocumentDataSource } from '../../domain/interfaces/IDocumentDataSource';
import { IFileStorageDataSource } from '../../domain/interfaces/IFileStorageDataSource';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { IProjectDataSource } from '../../domain/interfaces/IProjectDataSource';
import { IQuoteDataSource } from '../../domain/interfaces/IQuoteDataSource';
import { ITenderDataSource } from '../../domain/interfaces/ITenderDataSource';
import { ICollaboratorDataSource } from '../../domain/interfaces/ICollaboratorDataSource';
import { UploadFile } from '../../domain/entities/StoredFile';
import { DocumentResponse } from '../../domain/entities/Document';
import { Document } from '@prisma/client';

const ENTITY_LABELS: Record<string, string> = {
  client: 'Client',
  project: 'Project',
  quote: 'Quote',
  tender: 'Tender',
  collaborator: 'Collaborator',
};

export class DocumentService {
  private logger: Logger;
  private documentDataSource: IDocumentDataSource;
  private fileStorage: IFileStorageDataSource;
  private clientDataSource: IClientDataSource;
  private projectDataSource: IProjectDataSource;
  private quoteDataSource: IQuoteDataSource;
  private tenderDataSource: ITenderDataSource;
  private collaboratorDataSource: ICollaboratorDataSource;

  constructor(
    logger: Logger,
    documentDataSource: IDocumentDataSource,
    fileStorage: IFileStorageDataSource,
    clientDataSource: IClientDataSource,
    projectDataSource: IProjectDataSource,
    quoteDataSource: IQuoteDataSource,
    tenderDataSource: ITenderDataSource,
    collaboratorDataSource: ICollaboratorDataSource
  ) {
    this.logger = logger;
    this.documentDataSource = documentDataSource;
    this.fileStorage = fileStorage;
    this.clientDataSource = clientDataSource;
    this.projectDataSource = projectDataSource;
    this.quoteDataSource = quoteDataSource;
    this.tenderDataSource = tenderDataSource;
    this.collaboratorDataSource = collaboratorDataSource;
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
      case 'collaborator': {
        const entity = await this.collaboratorDataSource.getById(entityId);
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

  private toDocumentResponse(doc: Document): DocumentResponse {
    return {
      id: doc.id,
      entityType: doc.entityType,
      entityId: doc.entityId,
      name: doc.name,
      type: doc.type,
      url: this.fileStorage.buildPublicUrl(doc.url),
      size: doc.size,
      user: doc.user,
      isVisible: doc.isVisible,
      createdAt: doc.createdAt,
    };
  }

  async getAllDocuments(
    page?: number,
    limit?: number
  ): Promise<{ documents: DocumentResponse[]; total: number }> {
    this.logger.info(`Fetching all documents`);

    const result = await this.documentDataSource.getAll(page, limit);
    return {
      documents: result.documents.map(doc => this.toDocumentResponse(doc)),
      total: result.total,
    };
  }

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<DocumentResponse[]> {
    this.logger.info(`Fetching documents for ${entityType}/${entityId}`);

    const documents = await this.documentDataSource.getByEntity(entityType, entityId);
    return documents.map(doc => this.toDocumentResponse(doc));
  }

  async getDocumentById(id: number): Promise<DocumentResponse> {
    this.logger.info(`Fetching document by ID: ${id}`);

    const doc = await this.documentDataSource.getById(id);
    if (!doc) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    return this.toDocumentResponse(doc);
  }

  async createDocument(
    entityType: string,
    entityId: number,
    file: UploadFile,
    user: string,
    documentType?: string
  ): Promise<DocumentResponse> {
    this.logger.info(`Creating document for ${entityType}/${entityId}`);

    await this.validateEntityExists(entityType, entityId);

    const storedFile = await this.fileStorage.upload(`${entityType}s`, entityId, file);

    const doc = await this.documentDataSource.create({
      entityType,
      entityId,
      name: file.name,
      type: documentType || file.type,
      url: storedFile.key,
      size: file.buffer.length,
      user,
      isVisible: false,
    });

    this.logger.info(`Document created with ID: ${doc.id}`);
    return this.toDocumentResponse(doc);
  }

  async deleteDocument(id: number): Promise<void> {
    this.logger.info(`Deleting document ${id}`);

    const doc = await this.documentDataSource.getById(id);
    if (!doc) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    await this.fileStorage.deleteMany([{ name: doc.name, type: doc.type, key: doc.url, url: doc.url }]);

    await this.documentDataSource.delete(id);
    this.logger.info(`Document ${id} deleted successfully`);
  }
}
