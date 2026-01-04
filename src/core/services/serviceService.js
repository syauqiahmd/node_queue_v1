/**
 * @implements {IServiceService}
 */
class ServiceService {
  constructor({ prismaClient, logger }) {
    this.prisma = prismaClient;
    this.logger = logger;
  }

  async getAll(payload, pagination = true) {
    if (this.logger) {
      this.logger.info('[ServiceService] Fetching all services', { payload, pagination });
    }
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      prefix: payload.prefix ? { contains: payload.prefix, mode: 'insensitive' } : undefined,
      organizationId: payload.organizationId || undefined,
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
        orderBy: { [payload.sortBy]: payload.sortOrder },
        include: {
          organization: true,
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { totalRecord: count, data };
  }
  async publicGetAll(payload, pagination = true) {
    if (this.logger) {
      this.logger.info('[ServiceService] Fetching public services', { payload, pagination });
    }
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      prefix: payload.prefix ? { contains: payload.prefix, mode: 'insensitive' } : undefined,
      organizationId: payload.organizationId || undefined,
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
        where: {
          ...where,
          organization: {
            isActive: true,
          },
        },
        ...paginationPayload,
        orderBy: { [payload.sortBy]: payload.sortOrder },
        include: {
          organization: true,
        },
      }),
      this.prisma.service.count({
        where: {
          ...where,
          organization: {
            isActive: true,
          },
        },
      }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    if (this.logger) {
      this.logger.info(`[ServiceService] Fetching service by id: ${id}`);
    }
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });
  }

  async create(data) {
    if (this.logger) {
      this.logger.info('[ServiceService] Creating new service', { data });
    }
    return this.prisma.service.create({ data });
  }

  async update(id, data) {
    if (this.logger) {
      this.logger.info(`[ServiceService] Updating service: ${id}`, { data });
    }
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    if (this.logger) {
      this.logger.info(`[ServiceService] Removing service: ${id}`);
    }
    return this.prisma.service.delete({
      where: { id },
    });
  }
}

module.exports = ServiceService;
