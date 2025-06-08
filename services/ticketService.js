const { prisma } = require('../configs/prismaClient');
const businessException = require('../utils/businessException.js');

const generateQueueNumberAndCreateTicket = async ({
  serviceId,
  updatedBy = null,
  latestAssigneeCounterId = null,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { prefix: true },
  });

  if (!service) {
    throw businessException.NotFound('Service');
  }
  const prefix = service.prefix;

  const newTicket = await prisma.$transaction(async (tx) => {
    // get last ticket for prefix, service, and today inside transaction
    const lastTicket = await tx.ticket.findFirst({
      where: {
        serviceId,
        queueDate: today,
      },
      orderBy: { queueNumber: 'desc' },
    });

    const nextQueueNumber = lastTicket ? lastTicket.queueNumber + 1 : 1;

    return tx.ticket.create({
      data: {
        queueNumber: nextQueueNumber,
        prefix,
        queueDate: today,
        serviceId,
        updatedBy, // your updatedBy value here
        latestAssigneeCounterId, // optional
      },
    });
  });

  return newTicket;
};

module.exports = {
  generateQueueNumberAndCreateTicket,
};
