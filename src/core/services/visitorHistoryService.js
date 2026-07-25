class VisitorHistoryService {
  constructor({ prismaClient }) {
    this.prisma = prismaClient;
  }

  async getAll(payload) {
    const where = {
      visitorId: payload.visitorId || undefined,
      organizationId: payload.organizationId || undefined,
      visitor:
        payload.name || payload.phoneNumber || payload.email
          ? {
              name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
              phoneNumber: payload.phoneNumber
                ? { contains: payload.phoneNumber, mode: 'insensitive' }
                : undefined,
              email: payload.email ? { contains: payload.email, mode: 'insensitive' } : undefined,
            }
          : undefined,
      organization:
        payload.organizationName || payload.organizationFullName
          ? {
              name: payload.organizationName
                ? { contains: payload.organizationName, mode: 'insensitive' }
                : undefined,
              fullName: payload.organizationFullName
                ? { contains: payload.organizationFullName, mode: 'insensitive' }
                : undefined,
            }
          : undefined,
    };

    if (payload.visitDate) {
      const visitDate = new Date(payload.visitDate);
      visitDate.setUTCHours(0, 0, 0, 0);
      where.visitDate = visitDate;
    }

    const pagination = {};
    if (payload.pagination !== 'false') {
      pagination.skip = (payload.page - 1) * payload.pageSize;
      pagination.take = payload.pageSize;
    }

    const [data, count] = await Promise.all([
      this.prisma.visitorHistory.findMany({
        where,
        include: {
          visitor: { select: { id: true, name: true, phoneNumber: true, email: true } },
          organization: { select: { id: true, name: true, fullName: true } },
        },
        ...pagination,
        orderBy: { [payload.sortBy]: payload.sortOrder },
      }),
      this.prisma.visitorHistory.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async create(data) {
    // Create a timestamp in GMT+8 (UTC+8), matching TicketService's queueDate handling
    const timeStamp = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    const visitDate = new Date(timeStamp);
    visitDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.visitorHistory.create({
      data: {
        visitorId: data.visitorId,
        organizationId: data.organizationId,
        visitDate,
        createdAt: timeStamp,
      },
    });
  }
}

module.exports = VisitorHistoryService;
