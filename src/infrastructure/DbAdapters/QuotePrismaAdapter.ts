import { getPrismaClient } from '../../config/PrismaClient';
import { IQuoteDataSource, QuoteService } from '../../domain/interfaces/IQuoteDataSource';
import { Quote, Prisma } from '@prisma/client';

export class QuotePrismaAdapter implements IQuoteDataSource {
  private prisma = getPrismaClient();

  async getAll(page: number = 1, limit: number = 10): Promise<{ quotes: Quote[]; total: number }> {
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: true, project: true },
      }),
      this.prisma.quote.count(),
    ]);

    return { quotes, total };
  }

  async getById(id: number): Promise<Quote | null> {
    return await this.prisma.quote.findUnique({
      where: { id },
      include: { client: true, project: true },
    });
  }

  async getByClientId(clientId: number, page: number = 1, limit: number = 10): Promise<{ quotes: Quote[]; total: number }> {
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: true, project: true },
      }),
      this.prisma.quote.count({
        where: { clientId },
      }),
    ]);

    return { quotes, total };
  }

  async getByProjectId(projectId: number, page: number = 1, limit: number = 10): Promise<{ quotes: Quote[]; total: number }> {
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: true, project: true },
      }),
      this.prisma.quote.count({
        where: { projectId },
      }),
    ]);

    return { quotes, total };
  }

  async create(data: {
    code?: string;
    clientId: number;
    projectId?: number;
    status?: string;
    totalAmount: number;
    validUntil?: string;
    observations?: string;
    services: QuoteService[];
    isVisible?: boolean;
  }): Promise<Quote> {
    return await this.prisma.quote.create({
      data: {
        code: data.code || null,
        clientId: data.clientId,
        projectId: data.projectId || null,
        status: data.status || 'pendiente',
        totalAmount: data.totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        observations: data.observations || null,
        services: data.services as unknown as Prisma.InputJsonValue,
        isVisible: data.isVisible ?? false,
      },
      include: { client: true, project: true },
    });
  }

  async update(
    id: number,
    data: {
      code?: string;
      clientId?: number;
      projectId?: number;
      status?: string;
      totalAmount?: number;
      validUntil?: string;
      observations?: string;
      services?: QuoteService[];
      isVisible?: boolean;
    }
  ): Promise<Quote> {
    const updateData: Record<string, unknown> = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.services !== undefined) updateData.services = data.services as unknown as Prisma.InputJsonValue;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    return await this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: { client: true, project: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.quote.delete({
      where: { id },
    });
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<{ quotes: Quote[]; total: number }> {
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: {
          OR: [
            { code: { contains: query, mode: 'insensitive' } },
            { client: { name: { contains: query, mode: 'insensitive' } } },
            { client: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: true, project: true },
      }),
      this.prisma.quote.count({
        where: {
          OR: [
            { code: { contains: query, mode: 'insensitive' } },
            { client: { name: { contains: query, mode: 'insensitive' } } },
            { client: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
      }),
    ]);

    return { quotes, total };
  }
}
