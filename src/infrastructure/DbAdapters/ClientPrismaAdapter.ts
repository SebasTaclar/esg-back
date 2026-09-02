import { getPrismaClient } from '../../config/PrismaClient';
import { IClientDataSource, Contact, Resource } from '../../domain/interfaces/IClientDataSource';
import { Client, Prisma } from '@prisma/client';

export class ClientPrismaAdapter implements IClientDataSource {
  private prisma = getPrismaClient();

  async getAll(
    page?: number,
    limit?: number
  ): Promise<{ clients: Client[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count(),
    ]);

    return { clients, total };
  }

  async getById(id: number): Promise<Client | null> {
    return await this.prisma.client.findUnique({
      where: { id },
    });
  }

  async getByEmail(email: string): Promise<Client | null> {
    return await this.prisma.client.findFirst({
      where: { email },
    });
  }

  async getByUserId(userId: number): Promise<Client[]> {
    return await this.prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByNit(nit: string): Promise<Client | null> {
    return await this.prisma.client.findFirst({
      where: { nit },
    });
  }

  async create(data: {
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
    userId?: number;
    isVisible?: boolean;
  }): Promise<Client> {
    return await this.prisma.client.create({
      data: {
        name: data.name,
        nit: data.nit,
        code: data.code || null,
        organizationType: data.organizationType || null,
        norm: data.norm || null,
        city: data.city || null,
        department: data.department || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email,
        website: data.website || null,
        isActive: data.isActive ?? true,
        isProspect: data.isProspect ?? false,
        observations: data.observations || null,
        showResources: data.showResources ?? false,
        contacts: (data.contacts as unknown as Prisma.InputJsonValue) || null,
        resources: (data.resources as unknown as Prisma.InputJsonValue) || null,
        userId: data.userId || null,
        isVisible: data.isVisible ?? false,
      },
    });
  }

  async update(
    id: number,
    data: {
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
      isVisible?: boolean;
      userId?: number | null;
    }
  ): Promise<Client> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nit !== undefined) updateData.nit = data.nit;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.organizationType !== undefined) updateData.organizationType = data.organizationType;
    if (data.norm !== undefined) updateData.norm = data.norm;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isProspect !== undefined) updateData.isProspect = data.isProspect;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.showResources !== undefined) updateData.showResources = data.showResources;
    if (data.contacts !== undefined) updateData.contacts = data.contacts as unknown as Prisma.InputJsonValue;
    if (data.resources !== undefined) updateData.resources = data.resources as unknown as Prisma.InputJsonValue;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
    if (data.userId !== undefined) updateData.userId = data.userId;

    return await this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.client.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ clients: Client[]; total: number }> {
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { nit: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { nit: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { clients, total };
  }
}
