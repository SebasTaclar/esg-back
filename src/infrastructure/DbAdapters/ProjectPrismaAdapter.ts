import { getPrismaClient } from '../../config/PrismaClient';
import { IProjectDataSource } from '../../domain/interfaces/IProjectDataSource';
import { ProjectServiceItem } from '../../domain/entities/Project';
import { Project, Prisma } from '@prisma/client';

export class ProjectPrismaAdapter implements IProjectDataSource {
  private prisma = getPrismaClient();

  async getAll(
    page?: number,
    limit?: number
  ): Promise<{ projects: Project[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { client: true },
      }),
      this.prisma.project.count(),
    ]);

    return { projects, total };
  }

  async getById(id: number): Promise<Project | null> {
    return await this.prisma.project.findUnique({
      where: { id },
      include: { client: true },
    });
  }

  async getByClientId(
    clientId: number,
    page?: number,
    limit?: number
  ): Promise<{ projects: Project[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { clientId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { client: true },
      }),
      this.prisma.project.count({ where: { clientId } }),
    ]);

    return { projects, total };
  }

  async create(data: {
    clientId: number;
    serviceType?: string;
    norm?: string;
    status: string;
    responsible: string;
    startDate: string;
    endDate?: string;
    description: string;
    observations?: string;
    offer?: string;
    totalCost?: number;
    services?: ProjectServiceItem[];
  }): Promise<Project> {
    return await this.prisma.project.create({
      data: {
        clientId: data.clientId,
        serviceType: data.serviceType || null,
        norm: data.norm || null,
        status: data.status,
        responsible: data.responsible,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        description: data.description,
        observations: data.observations || null,
        offer: data.offer || null,
        totalCost: data.totalCost || null,
        services: (data.services as unknown as Prisma.InputJsonValue) || null,
      },
      include: { client: true },
    });
  }

  async update(
    id: number,
    data: {
      clientId?: number;
      serviceType?: string;
      norm?: string;
      status?: string;
      responsible?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      observations?: string;
      offer?: string;
      totalCost?: number;
      services?: ProjectServiceItem[];
    }
  ): Promise<Project> {
    const updateData: Record<string, unknown> = {};

    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.norm !== undefined) updateData.norm = data.norm;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responsible !== undefined) updateData.responsible = data.responsible;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.offer !== undefined) updateData.offer = data.offer;
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost;
    if (data.services !== undefined) updateData.services = data.services as unknown as Prisma.InputJsonValue;

    return await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: Project[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchFilter = { contains: query, mode: 'insensitive' as const };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          OR: [
            { description: searchFilter },
            { responsible: searchFilter },
            { client: { name: searchFilter } },
            { services: { path: '$[*].name', string_contains: query } } as unknown as Prisma.ProjectWhereInput,
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: true },
      }),
      this.prisma.project.count({
        where: {
          OR: [
            { description: searchFilter },
            { responsible: searchFilter },
            { client: { name: searchFilter } },
            { services: { path: '$[*].name', string_contains: query } } as unknown as Prisma.ProjectWhereInput,
          ],
        },
      }),
    ]);

    return { projects, total };
  }
}
