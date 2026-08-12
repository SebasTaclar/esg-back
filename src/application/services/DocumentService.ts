import { NotFoundError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IDocumentDataSource } from '../../domain/interfaces/IDocumentDataSource';
import { IFileStorageDataSource } from '../../domain/interfaces/IFileStorageDataSource';
import { UploadFile } from '../../domain/entities/StoredFile';
import { DocumentRequest, DocumentResponse } from '../../domain/entities/Document';
import { Document } from '@prisma/client';

function toDocumentResponse(doc: Document): DocumentResponse {
  return {
    id: doc.id,
    entityType: doc.entityType,
    entityId: doc.entityId,
    name: doc.name,
    type: doc.type,
    url: doc.url,
    size: doc.size,
    user: doc.user,
    createdAt: doc.createdAt,
  };
}

export class DocumentService {
  private logger: Logger;
  private documentDataSource: IDocumentDataSource;
  private fileStorage: IFileStorageDataSource;

  constructor(logger: Logger, documentDataSource: IDocumentDataSource, fileStorage: IFileStorageDataSource) {
    this.logger = logger;
    this.documentDataSource = documentDataSource;
    this.fileStorage = fileStorage;
  }

  async getAllDocuments(
    page?: number,
    limit?: number
  ): Promise<{ documents: DocumentResponse[]; total: number }> {
    this.logger.info(`Fetching all documents`);

    const result = await this.documentDataSource.getAll(page, limit);
    return {
      documents: result.documents.map(toDocumentResponse),
      total: result.total,
    };
  }

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<DocumentResponse[]> {
    this.logger.info(`Fetching documents for ${entityType}/${entityId}`);

    const documents = await this.documentDataSource.getByEntity(entityType, entityId);
    return documents.map(toDocumentResponse);
  }

  async getDocumentById(id: number): Promise<DocumentResponse> {
    this.logger.info(`Fetching document by ID: ${id}`);

    const doc = await this.documentDataSource.getById(id);
    if (!doc) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    return toDocumentResponse(doc);
  }

  async createDocument(
    entityType: string,
    entityId: number,
    file: UploadFile,
    user: string,
    documentType?: string
  ): Promise<DocumentResponse> {
    this.logger.info(`Creating document for ${entityType}/${entityId}`);

    const storedFile = await this.fileStorage.upload(`${entityType}s`, entityId, file);

    const doc = await this.documentDataSource.create({
      entityType,
      entityId,
      name: file.name,
      type: documentType || file.type,
      url: storedFile.url,
      size: file.buffer.length,
      user,
    });

    this.logger.info(`Document created with ID: ${doc.id}`);
    return toDocumentResponse(doc);
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
