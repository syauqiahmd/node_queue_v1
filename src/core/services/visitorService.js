/**
 * @implements {IVisitorService}
 */
class VisitorService {
  constructor({ prismaClient, phoneNormalizer }) {
    this.prisma = prismaClient;
    this.phoneNormalizer = phoneNormalizer;
  }

  async getAll(payload) {
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      phoneNumber: payload.phoneNumber
        ? { contains: payload.phoneNumber, mode: 'insensitive' }
        : undefined,
      email: payload.email ? { contains: payload.email, mode: 'insensitive' } : undefined,
      histories: payload.organizationId
        ? { some: { organizationId: payload.organizationId } }
        : undefined,
    };

    const pagination = {};
    if (payload.pagination !== 'false') {
      pagination.skip = (payload.page - 1) * payload.pageSize;
      pagination.take = payload.pageSize;
    }

    const [data, count] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        ...pagination,
        orderBy: { [payload.sortBy]: payload.sortOrder },
      }),
      this.prisma.visitor.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async upsertByPhoneNumber(data) {
    const phoneNumber = this.phoneNormalizer.normalize(data.phoneNumber);

    return this.prisma.visitor.upsert({
      where: { phoneNumber },
      create: {
        name: data.name,
        phoneNumber,
        email: data.email,
      },
      update: {
        name: data.name,
        email: data.email,
        updatedBy: '-1',
      },
    });
  }
}

module.exports = VisitorService;
