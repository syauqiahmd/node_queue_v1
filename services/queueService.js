const { prisma } = require('../configs/prismaClient');
const businessException = require('../utils/businessException');

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

exports.callNextQueue = async (payload) => {
  const { serviceId, counterId } = payload;
  const getLastTicket = await prisma.ticket.findFirst({
    where: {
      serviceId,
      isCall: false,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
        lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
      },
    },
    orderBy: { createdAt: 'asc' },
    skip: 0,
    take: 1,
  });

  if (!getLastTicket) {
    throw businessException.NotFound('queue');
  }

  const { id: queueId } = getLastTicket;
  const updatedTicket = await prisma.ticket.update({
    where: { id: queueId },
    data: {
      isCall: true,
      latestAssigneeCounterId: counterId,
    },
    include: {
      service: {
        include: {
          organization: true,
        },
      },
    },
  });

  return updatedTicket;
};

// exports.actionQueueById = async (payload) => { };

exports.getCurrentQueueDetailById = async (id) => {
  return await prisma.ticket.findUnique({
    where: {
      id,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
        lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
      },
    },
    include: {
      service: {
        include: {
          organization: true,
        },
      },
    },
  });
};

exports.updateQueueById = async (id, payload) => {
  return await prisma.ticket.update({
    where: { id },
    data: payload,
    include: {
      service: {
        include: {
          organization: true,
        },
      },
    },
  });
};

exports.getCallingQueue = async () => {
  const where = {
    isCall: true,
    isResolved: false,
    updatedAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
      lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
    },
  };

  return prisma.ticket.findMany({
    where,
    include: {
      service: {
        include: {
          organization: true,
        },
      },
      latestAssigneeCounter: true,
    },
    orderBy: { updatedAt: 'desc' },
    skip: 0,
    take: 4,
  });
};
