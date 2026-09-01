import { getPrismaClient } from '../../config/PrismaClient';
import { ITenderDataSource } from '../../domain/interfaces/ITenderDataSource';
import { Tender } from '@prisma/client';
import { TenderServiceItem } from '../../domain/entities/Tender';

export class TenderPrismaAdapter implements ITenderDataSource {
  private prisma = getPrismaClient();

  async getAll(
    page?: number,
    limit?: number
  ): Promise<{ tenders: Tender[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [tenders, total] = await Promise.all([
      this.prisma.tender.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tender.count(),
    ]);

    return { tenders, total };
  }

  async getById(id: number): Promise<Tender | null> {
    return await this.prisma.tender.findUnique({
      where: { id },
    });
  }

  async create(data: {
    offerCode?: string;
    type: string;
    processNumber?: string;
    clientName: string;
    service: string;
    norm?: string;
    status: string;
    publicationDate: string;
    closingDate?: string;
    estimatedValue?: number;
    serviceItems?: TenderServiceItem[];
    observations?: string;
    isVisible?: boolean;
  }): Promise<Tender> {
    return await this.prisma.tender.create({
      data: {
        offerCode: data.offerCode || null,
        type: data.type,
        processNumber: data.processNumber || null,
        clientName: data.clientName,
        service: data.service,
        norm: data.norm || null,
        status: data.status,
        publicationDate: new Date(data.publicationDate),
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
        estimatedValue: data.estimatedValue || null,
        serviceItems: data.serviceItems || null,
        observations: data.observations || null,
        isVisible: data.isVisible ?? false,
      },
    });
  }

  async update(
    id: number,
    data: {
      offerCode?: string;
      type?: string;
      processNumber?: string;
      clientName?: string;
      service?: string;
      norm?: string;
      status?: string;
      publicationDate?: string;
      closingDate?: string;
      estimatedValue?: number;
      serviceItems?: TenderServiceItem[];
      observations?: string;
      isVisible?: boolean;
    }
  ): Promise<Tender> {
    const updateData: Record<string, unknown> = {};

    if (data.offerCode !== undefined) updateData.offerCode = data.offerCode;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.processNumber !== undefined) updateData.processNumber = data.processNumber;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.service !== undefined) updateData.service = data.service;
    if (data.norm !== undefined) updateData.norm = data.norm;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publicationDate !== undefined) updateData.publicationDate = new Date(data.publicationDate);
    if (data.closingDate !== undefined) updateData.closingDate = data.closingDate ? new Date(data.closingDate) : null;
    if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue;
    if (data.serviceItems !== undefined) updateData.serviceItems = data.serviceItems;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    return await this.prisma.tender.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.tender.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ tenders: Tender[]; total: number }> {
    const skip = (page - 1) * limit;

    const [tenders, total] = await Promise.all([
      this.prisma.tender.findMany({
        where: {
          OR: [
            { clientName: { contains: query, mode: 'insensitive' } },
            { service: { contains: query, mode: 'insensitive' } },
            { processNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tender.count({
        where: {
          OR: [
            { clientName: { contains: query, mode: 'insensitive' } },
            { service: { contains: query, mode: 'insensitive' } },
            { processNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { tenders, total };
  }
}
