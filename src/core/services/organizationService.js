/**
 * @implements {IOrganizationService}
 */
class OrganizationService {
  constructor({ prismaClient }) {
    this.prisma = prismaClient;
  }

  async getAll(payload) {
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      fullName: payload.fullName ? { contains: payload.fullName, mode: 'insensitive' } : undefined,
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };

    const [data, count] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip: (payload.page - 1) * payload.pageSize,
        take: payload.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async create(data) {
    return this.prisma.organization.create({ data });
  }

  async update(id, data) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    return this.prisma.organization.delete({ where: { id } });
  }

  async getAllWithService(payload) {
    const { OrganizationResponse } = require('../dto/organizationResponse');
    const where = {
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };
    const organizations = await this.prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        services: {
          where,
          select: {
            id: true,
            name: true,
            prefix: true,
          },
        },
      },
      orderBy: { name: 'desc' },
    });

    return organizations.map((organization) => new OrganizationResponse(organization));
  }
}

module.exports = OrganizationService;
