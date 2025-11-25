/**
 * @implements {ICounterService}
 */
class CounterService {
  constructor({ prismaClient }) {
    this.prisma = prismaClient;
  }

  async getAll(payload) {
    const where = {
      counterNumber: payload.counterNumber
        ? { contains: payload.counterNumber, mode: 'insensitive' }
        : undefined,
      serviceId: payload.serviceId || undefined,
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };

    const pagination = {};
    if (payload.pagination !== 'false') {
      pagination.skip = (payload.page - 1) * payload.pageSize;
      pagination.take = payload.pageSize;
    }

    const [data, count] = await Promise.all([
      this.prisma.counter.findMany({
        where,
        include: {
          service: {
            include: {
              organization: true,
            },
          },
        },
        ...pagination,
        orderBy: { [payload.sortBy]: payload.sortOrder },
      }),
      this.prisma.counter.count({
        where,
      }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    return this.prisma.counter.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  async create(data) {
    return this.prisma.counter.create({ data });
  }

  async update(id, data) {
    return this.prisma.counter.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    return this.prisma.counter.delete({ where: { id } });
  }
}

module.exports = CounterService;
