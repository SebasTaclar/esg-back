import { NotFoundError, ConflictError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IClientDataSource, Contact, Resource } from '../../domain/interfaces/IClientDataSource';
import { Decimal } from '@prisma/client/runtime/library';
import { Client } from '@prisma/client';

export interface ClientRequest {
  name: string;
  nit: string;
  code?: string;
  organizationType?: string;
  norm?: string;
  city?: string;
  department?: string;
  address?: string;
  phone?: string;
  email: string;
  website?: string;
  isActive?: boolean;
  isProspect?: boolean;
  observations?: string;
  showResources?: boolean;
  contacts?: Contact[];
  resources?: Resource[];
}

export interface ClientResponse {
  id: number;
  name: string;
  nit: string;
  code?: string | null;
  organizationType?: string | null;
  norm?: string | null;
  city?: string | null;
  department?: string | null;
  address?: string | null;
  phone?: string | null;
  email: string;
  website?: string | null;
  isActive: boolean;
  isProspect: boolean;
  observations?: string | null;
  showResources: boolean;
  contacts?: Contact[] | null;
  resources?: Resource[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClientRequest {
  name?: string;
  nit?: string;
  code?: string;
  organizationType?: string;
  norm?: string;
  city?: string;
  department?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
  isProspect?: boolean;
  observations?: string;
  showResources?: boolean;
  contacts?: Contact[];
  resources?: Resource[];
}

function toClientResponse(client: Client): ClientResponse {
  return {
    id: client.id,
    name: client.name,
    nit: client.nit,
    code: client.code,
    organizationType: client.organizationType,
    norm: client.norm,
    city: client.city,
    department: client.department,
    address: client.address,
    phone: client.phone,
    email: client.email,
    website: client.website,
    isActive: client.isActive,
    isProspect: client.isProspect,
    observations: client.observations,
    showResources: client.showResources,
    contacts: (client.contacts as Contact[]) || null,
    resources: (client.resources as Resource[]) || null,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

export class ClientService {
  private logger: Logger;
  private clientDataSource: IClientDataSource;

  constructor(logger: Logger, clientDataSource: IClientDataSource) {
    this.logger = logger;
    this.clientDataSource = clientDataSource;
  }

  async createClient(data: ClientRequest): Promise<ClientResponse> {
    this.logger.info(`Creating new client with email: ${data.email}`);

    const existingClient = await this.clientDataSource.getByEmail(data.email);
    if (existingClient) {
      throw new ConflictError(`Client with email ${data.email} already exists`);
    }

    const existingNit = await this.clientDataSource.getByNit(data.nit);
    if (existingNit) {
      throw new ConflictError(`Client with NIT ${data.nit} already exists`);
    }

    const client = await this.clientDataSource.create({
      name: data.name,
      nit: data.nit,
      code: data.code,
      organizationType: data.organizationType,
      norm: data.norm,
      city: data.city,
      department: data.department,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      isActive: data.isActive,
      isProspect: data.isProspect,
      observations: data.observations,
      showResources: data.showResources,
      contacts: data.contacts,
      resources: data.resources,
    });

    this.logger.info(`Client created with ID: ${client.id}`);
    return toClientResponse(client);
  }

  async getAllClients(
    page?: number,
    limit?: number
  ): Promise<{ clients: ClientResponse[]; total: number }> {
    this.logger.info(`Fetching all clients - Page: ${page || 'all'}, Limit: ${limit || 'all'}`);

    const result = await this.clientDataSource.getAll(page, limit);
    return {
      clients: result.clients.map(toClientResponse),
      total: result.total,
    };
  }

  async getClientById(id: number): Promise<ClientResponse> {
    this.logger.info(`Fetching client by ID: ${id}`);

    const client = await this.clientDataSource.getById(id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    return toClientResponse(client);
  }

  async getClientByEmail(email: string): Promise<ClientResponse | null> {
    this.logger.info(`Fetching client by email: ${email}`);

    const client = await this.clientDataSource.getByEmail(email);
    return client ? toClientResponse(client) : null;
  }

  async updateClient(id: number, data: UpdateClientRequest): Promise<ClientResponse> {
    this.logger.info(`Updating client with ID: ${id}`);

    const existingClient = await this.clientDataSource.getById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    if (data.email && data.email !== existingClient.email) {
      const emailExists = await this.clientDataSource.getByEmail(data.email);
      if (emailExists) {
        throw new ConflictError(`Email ${data.email} is already in use`);
      }
    }

    if (data.nit && data.nit !== existingClient.nit) {
      const nitExists = await this.clientDataSource.getByNit(data.nit);
      if (nitExists) {
        throw new ConflictError(`NIT ${data.nit} is already in use`);
      }
    }

    await this.clientDataSource.update(id, data);

    this.logger.info(`Client ${id} updated successfully`);
    return this.getClientById(id);
  }

  async deleteClient(id: number): Promise<void> {
    this.logger.info(`Deleting client with ID: ${id}`);

    const existingClient = await this.clientDataSource.getById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    await this.clientDataSource.delete(id);
    this.logger.info(`Client ${id} deleted successfully`);
  }

  async searchClients(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ clients: ClientResponse[]; total: number }> {
    this.logger.info(`Searching clients with query: ${query}`);

    const result = await this.clientDataSource.search(query, page, limit);
    return {
      clients: result.clients.map(toClientResponse),
      total: result.total,
    };
  }
}
