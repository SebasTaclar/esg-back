import { NotFoundError, ConflictError } from '../../shared/exceptions';
import { Logger } from '../../shared/Logger';
import { IProjectDataSource } from '../../domain/interfaces/IProjectDataSource';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { ProjectRequest, ProjectResponse, UpdateProjectRequest, ProjectServiceItem } from '../../domain/entities/Project';
import { Project } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toProjectResponse(project: Project): ProjectResponse {
  const client = (project as Project & { client?: { id: number; name: string; email: string; nit: string } }).client;
  return {
    id: project.id,
    clientId: project.clientId,
    client: client
      ? { id: client.id, name: client.name, email: client.email, nit: client.nit }
      : undefined,
    serviceType: project.serviceType,
    norm: project.norm,
    status: project.status,
    responsible: project.responsible,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    observations: project.observations,
    offer: project.offer,
    totalCost: project.totalCost,
    services: (project.services as ProjectServiceItem[]) || null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export class ProjectService {
  private logger: Logger;
  private projectDataSource: IProjectDataSource;
  private clientDataSource: IClientDataSource;

  constructor(logger: Logger, projectDataSource: IProjectDataSource, clientDataSource: IClientDataSource) {
    this.logger = logger;
    this.projectDataSource = projectDataSource;
    this.clientDataSource = clientDataSource;
  }

  async getAllProjects(
    page?: number,
    limit?: number
  ): Promise<{ projects: ProjectResponse[]; total: number }> {
    this.logger.info(`Fetching all projects - Page: ${page || 'all'}, Limit: ${limit || 'all'}`);

    const result = await this.projectDataSource.getAll(page, limit);
    return {
      projects: result.projects.map(toProjectResponse),
      total: result.total,
    };
  }

  async getProjectById(id: number): Promise<ProjectResponse> {
    this.logger.info(`Fetching project by ID: ${id}`);

    const project = await this.projectDataSource.getById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    return toProjectResponse(project);
  }

  async getProjectsByClientId(
    clientId: number,
    page?: number,
    limit?: number
  ): Promise<{ projects: ProjectResponse[]; total: number }> {
    this.logger.info(`Fetching projects for client ${clientId}`);

    const result = await this.projectDataSource.getByClientId(clientId, page, limit);
    return {
      projects: result.projects.map(toProjectResponse),
      total: result.total,
    };
  }

  async createProject(request: ProjectRequest): Promise<ProjectResponse> {
    this.logger.info(`Creating project for client ${request.clientId}`);

    const client = await this.clientDataSource.getById(request.clientId);
    if (!client) {
      throw new NotFoundError(`Client with ID ${request.clientId} not found`);
    }

    const project = await this.projectDataSource.create({
      clientId: request.clientId,
      serviceType: request.serviceType,
      norm: request.norm,
      status: request.status,
      responsible: request.responsible,
      startDate: request.startDate,
      endDate: request.endDate,
      description: request.description,
      observations: request.observations,
      offer: request.offer,
      totalCost: request.totalCost,
      services: request.services,
    });

    this.logger.info(`Project created with ID: ${project.id}`);
    return toProjectResponse(project);
  }

  async updateProject(id: number, request: UpdateProjectRequest): Promise<ProjectResponse> {
    this.logger.info(`Updating project ${id}`);

    const existingProject = await this.projectDataSource.getById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    if (request.clientId) {
      const client = await this.clientDataSource.getById(request.clientId);
      if (!client) {
        throw new NotFoundError(`Client with ID ${request.clientId} not found`);
      }
    }

    const updatedProject = await this.projectDataSource.update(id, {
      clientId: request.clientId,
      serviceType: request.serviceType,
      norm: request.norm,
      status: request.status,
      responsible: request.responsible,
      startDate: request.startDate,
      endDate: request.endDate,
      description: request.description,
      observations: request.observations,
      offer: request.offer,
      totalCost: request.totalCost,
      services: request.services,
    });

    this.logger.info(`Project ${id} updated successfully`);
    return toProjectResponse(updatedProject);
  }

  async deleteProject(id: number): Promise<void> {
    this.logger.info(`Deleting project ${id}`);

    const existingProject = await this.projectDataSource.getById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    await this.projectDataSource.delete(id);
    this.logger.info(`Project ${id} deleted successfully`);
  }

  async searchProjects(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: ProjectResponse[]; total: number }> {
    this.logger.info(`Searching projects with query: ${query}`);

    const result = await this.projectDataSource.search(query, page, limit);
    return {
      projects: result.projects.map(toProjectResponse),
      total: result.total,
    };
  }
}
