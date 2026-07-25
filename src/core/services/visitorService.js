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

  async getReport({ name, phoneNumber, email, organizationId, startDate, endDate }) {
    // createdAt is a full timestamp (unlike DailyServiceStats.date or VisitorHistory.visitDate,
    // which are date-only columns) — the upper bound must cover the whole day, not just midnight.
    const end = endDate ? new Date(endDate) : undefined;
    if (end) {
      end.setUTCHours(23, 59, 59, 999);
    }

    const where = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      phoneNumber: phoneNumber ? { contains: phoneNumber, mode: 'insensitive' } : undefined,
      email: email ? { contains: email, mode: 'insensitive' } : undefined,
      histories: organizationId ? { some: { organizationId } } : undefined,
      createdAt: {
        gte: new Date(startDate),
        lte: end,
      },
    };

    return this.prisma.visitor.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async upsertByPhoneNumber(data) {
    const phoneNumber = this.phoneNormalizer.normalize(data.phoneNumber);
    // Create a timestamp in GMT+8 (UTC+8), matching TicketService/VisitorHistoryService so
    // "Registered At" and "Recorded At" land on the same calendar day for the same real moment.
    const timeStamp = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8

    return this.prisma.visitor.upsert({
      where: { phoneNumber },
      create: {
        name: data.name,
        phoneNumber,
        email: data.email,
        createdAt: timeStamp,
        updatedAt: timeStamp,
      },
      update: {
        name: data.name,
        email: data.email,
        updatedBy: '-1',
        updatedAt: timeStamp,
      },
    });
  }
}

module.exports = VisitorService;
