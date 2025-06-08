const { prisma } = require('../configs/prismaClient');

const applyStatusFilter = (where, status) => {
  if (status === 'in-progress') {
    where.isCall = true;
  }
  if (status === 'completed') {
    delete where.isCall;
    where.isResolved = true;
  }
};

exports.getQueueListByServiceId = async (serviceId, { counterId, status }) => {
  const where = {
    serviceId,
    isCall: false,
    latestAssigneeCounterId: counterId || undefined, // Use undefined to ignore if not provided
    createdAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
      lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
    },
  };
  if (status) {
    applyStatusFilter(where, status);
  }

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
};

exports.getTotalQueueByServiceId = async (serviceId, status = null) => {
  const where = {
    serviceId,
    isCall: false,
    createdAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
      lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
    },
  };

  if (status) {
    applyStatusFilter(where, status);
  }

  return prisma.ticket.count({
    where,
    orderBy: { createdAt: 'asc' },
  });
};
