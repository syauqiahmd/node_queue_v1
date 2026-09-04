const { nowInAppTz } = require('../utils/date');

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

  async getReport({
    visitorId,
    name,
    phoneNumber,
    email,
    organizationId,
    organizationName,
    organizationFullName,
    startDate,
    endDate,
  }) {
    const where = {
      visitorId: visitorId || undefined,
      organizationId: organizationId || undefined,
      visitor:
        name || phoneNumber || email
          ? {
              name: name ? { contains: name, mode: 'insensitive' } : undefined,
              phoneNumber: phoneNumber ? { contains: phoneNumber, mode: 'insensitive' } : undefined,
              email: email ? { contains: email, mode: 'insensitive' } : undefined,
            }
          : undefined,
      organization:
        organizationName || organizationFullName
          ? {
              name: organizationName
                ? { contains: organizationName, mode: 'insensitive' }
                : undefined,
              fullName: organizationFullName
                ? { contains: organizationFullName, mode: 'insensitive' }
                : undefined,
            }
          : undefined,
      visitDate: {
        gte: new Date(startDate),
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    return this.prisma.visitorHistory.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        visitor: { select: { id: true, name: true, phoneNumber: true, email: true } },
        organization: { select: { id: true, name: true, fullName: true } },
      },
    });
  }

  async create(data) {
    // Matches TicketService's queueDate handling
    const timeStamp = nowInAppTz();
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
