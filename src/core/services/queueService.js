const toTicketCalledDTO = require('../dto/websocket/TicketCalledDTO');
const toTicketResolvedDTO = require('../dto/websocket/TicketResolvedDTO');
const toTicketPrioritizedDTO = require('../dto/websocket/TicketPrioritizedDTO');

class QueueService {
  constructor({ prismaClient, businessException, googleTextToSpeechService, broadcastService }) {
    this.prisma = prismaClient;
    this.businessException = businessException;
    this.googleTextToSpeechService = googleTextToSpeechService;
    this.broadcastService = broadcastService;
  }

  applyStatusFilter(where, status) {
    if (status === 'in-progress') {
      where.isCall = true;
    }
    if (status === 'completed') {
      delete where.isCall;
      where.isResolved = true;
    }
  }

  async getQueueListByServiceId(serviceId, { counterId, status }) {
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
      this.applyStatusFilter(where, status);
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTotalQueueByServiceId(serviceId, status = null) {
    const where = {
      serviceId,
      isCall: false,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
        lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
      },
    };

    if (status) {
      this.applyStatusFilter(where, status);
    }

    return this.prisma.ticket.count({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async callNextQueue(payload) {
    const { serviceId, counterId } = payload;

    const findTicket = async (isPriority) => {
      return await this.prisma.ticket.findFirst({
        where: {
          serviceId,
          isCall: false,
          isPriority,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
            lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    };

    let ticketToCall = await findTicket(true); // Prioritize priority tickets

    if (!ticketToCall) {
      ticketToCall = await findTicket(false); // Fallback to non-priority tickets
    }

    if (!ticketToCall) {
      throw this.businessException.NotFound('queue');
    }

    // Verify if the counterId exists
    const existingCounter = await this.prisma.counter.findUnique({
      where: { id: counterId },
    });

    if (!existingCounter) {
      throw this.businessException.NotFound('Counter');
    }

    const { id: queueId } = ticketToCall;
    const updatedTicket = await this.prisma.ticket.update({
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
        latestAssigneeCounter: true,
      },
    });

    // Broadcast the event
    const rooms = [`service-${updatedTicket.serviceId}`, 'monitor-room'];
    this.broadcastService.emit('ticket:called', toTicketCalledDTO(updatedTicket), rooms);

    return updatedTicket;
  }

  async getCurrentQueueDetailById(id) {
    return await this.prisma.ticket.findUnique({
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
  }

  async updateQueueById(id, payload) {
    const currentTicket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { latestAssigneeCounter: true },
    });

    if (!currentTicket) {
      throw this.businessException.NotFound('ticket');
    }

    const oldCounter = currentTicket.latestAssigneeCounter;
    const newCounterId = payload.latestAssigneeCounterId;

    if (newCounterId && oldCounter && newCounterId !== oldCounter.id) {
      const oldAnnouncementText = `Nomor antrian: ${currentTicket.prefix} - ${currentTicket.queueNumber}; silahkan menuju, ke loket nomor, ${oldCounter.counterNumber}`;
      await this.googleTextToSpeechService.invalidateCache(oldAnnouncementText);
    }

    const updatedTicket = await this.prisma.ticket.update({
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

    // Broadcast if the ticket is resolved
    if (payload.isResolved) {
      const rooms = [`service-${updatedTicket.serviceId}`];
      this.broadcastService.emit('ticket:resolved', toTicketResolvedDTO(updatedTicket), rooms);
    }

    return updatedTicket;
  }

  async getCallingQueue() {
    const where = {
      isCall: true,
      isResolved: false,
      updatedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
        lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
      },
    };

    return this.prisma.ticket.findMany({
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
  }

  async queueDetailById(queueId) {
    return this.prisma.ticket.findUnique({
      where: {
        id: queueId,
      },
      include: {
        latestAssigneeCounter: true,
      },
    });
  }

  async prioritizeTicket(queueId) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: queueId } });
    if (!ticket) {
      throw this.businessException.NotFound('ticket');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: queueId },
      data: { isPriority: true },
    });

    // Broadcast the event
    const rooms = [`service-${updatedTicket.serviceId}`];
    this.broadcastService.emit('ticket:prioritized', toTicketPrioritizedDTO(updatedTicket), rooms);

    return updatedTicket;
  }
}

module.exports = QueueService;
