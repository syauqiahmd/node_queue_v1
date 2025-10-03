const IServiceService = require('../interfaces/IServiceService');

class ServiceService extends IServiceService {
  constructor({ prismaClient }) {
    super();
    this.prisma = prismaClient;
  }

  async getAll(payload, pagination = true) {
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      prefix: payload.prefix ? { contains: payload.prefix, mode: 'insensitive' } : undefined,
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };

    let paginationPayload = {};
    if (pagination) {
      paginationPayload = {
        skip: (payload.page - 1) * payload.pageSize || 0,
        take: payload.pageSize || 10,
      };
    }

    const [data, count] = await Promise.all([
      this.prisma.service.findMany({
        where,
        ...paginationPayload,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });
  }

  async create(data) {
    return this.prisma.service.create({ data });
  }

  async update(id, data) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    return this.prisma.service.delete({ where: { id } });
  }
}

module.exports = ServiceService;
