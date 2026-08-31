import { getPrismaClient } from '../../config/PrismaClient';
import { ICollaboratorDataSource } from '../../domain/interfaces/ICollaboratorDataSource';
import { Collaborator, Prisma } from '@prisma/client';

export class CollaboratorPrismaAdapter implements ICollaboratorDataSource {
  private prisma = getPrismaClient();

  async getAll(
    page?: number,
    limit?: number
  ): Promise<{ collaborators: Collaborator[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [collaborators, total] = await Promise.all([
      this.prisma.collaborator.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.collaborator.count(),
    ]);

    return { collaborators, total };
  }

  async getById(id: number): Promise<Collaborator | null> {
    return await this.prisma.collaborator.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    studies: string;
    mainArea: string;
    city: string;
    phone?: string;
    email?: string;
    status?: string;
    competencies?: unknown;
    documents?: unknown;
  }): Promise<Collaborator> {
    return await this.prisma.collaborator.create({
      data: {
        name: data.name,
        studies: data.studies,
        mainArea: data.mainArea,
        city: data.city,
        phone: data.phone || null,
        email: data.email || null,
        status: data.status || 'available',
        competencies: (data.competencies as Prisma.InputJsonValue) || null,
        documents: (data.documents as Prisma.InputJsonValue) || null,
      },
    });
  }

  async update(
    id: number,
    data: {
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
  ): Promise<Collaborator> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.studies !== undefined) updateData.studies = data.studies;
    if (data.mainArea !== undefined) updateData.mainArea = data.mainArea;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.competencies !== undefined) updateData.competencies = data.competencies as Prisma.InputJsonValue;
    if (data.documents !== undefined) updateData.documents = data.documents as Prisma.InputJsonValue;

    return await this.prisma.collaborator.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.collaborator.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ collaborators: Collaborator[]; total: number }> {
    const skip = (page - 1) * limit;

    const [collaborators, total] = await Promise.all([
      this.prisma.collaborator.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mainArea: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { studies: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.collaborator.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mainArea: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { studies: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { collaborators, total };
  }
}
