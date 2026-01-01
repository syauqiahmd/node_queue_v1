const toTicketCalledDTO = require('../dto/websocket/TicketCalledDTO');
const toTicketResolvedDTO = require('../dto/websocket/TicketResolvedDTO');
const toTicketPrioritizedDTO = require('../dto/websocket/TicketPrioritizedDTO');
const toTicketRecalledDTO = require('../dto/websocket/TicketRecalledDTO');

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
      where.isResolved = false;
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
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      const existingCounter = await tx.counter.findUnique({ where: { id: counterId } });
      if (!existingCounter) {
        throw this.businessException.NotFound('Counter');
      }

      const priorityRow = await tx.$queryRaw`
        SELECT id FROM "Ticket"
        WHERE "service_id" = CAST(${serviceId} AS uuid)
          AND "is_call" = false
          AND "is_priority" = true
          AND "created_at" BETWEEN CAST(${dayStart} AS timestamp) AND CAST(${dayEnd} AS timestamp)
        ORDER BY "created_at" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      let selectedId = Array.isArray(priorityRow) && priorityRow.length ? priorityRow[0].id : null;

      if (!selectedId) {
        const normalRow = await tx.$queryRaw`
          SELECT id FROM "Ticket"
          WHERE "service_id" = CAST(${serviceId} AS uuid)
            AND "is_call" = false
            AND "is_priority" = false
            AND "created_at" BETWEEN CAST(${dayStart} AS timestamp) AND CAST(${dayEnd} AS timestamp)
          ORDER BY "created_at" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;
        selectedId = Array.isArray(normalRow) && normalRow.length ? normalRow[0].id : null;
      }

      if (!selectedId) {
        throw this.businessException.NotFound('queue');
      }

      const updated = await tx.ticket.update({
        where: { id: selectedId },
        data: {
          isCall: true,
          latestAssigneeCounterId: counterId,
        },
        include: {
          service: { include: { organization: true } },
          latestAssigneeCounter: true,
        },
      });

      return updated;
    });

    const callingText = `Nomor antrian: ${updatedTicket.prefix} - ${updatedTicket.queueNumber}; silahkan menuju, ke loket nomor, ${updatedTicket.latestAssigneeCounter.counterNumber}`;
    const soundUrl = await this.googleTextToSpeechService.generateSound(
      callingText,
      updatedTicket.id
    );

    // Update the ticket with the sound URL
    const finalTicket = await this.prisma.ticket.update({
      where: { id: updatedTicket.id },
      data: { soundUrl },
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
    this.broadcastService.emit(
      'ticket:called',
      toTicketCalledDTO({ ...finalTicket, soundUrl }),
      rooms
    );

    return finalTicket;
  }

  async recallTicket(queueId, newCounterId) {
    let ticket = await this.prisma.ticket.findUnique({
      where: { id: queueId },
      include: {
        service: { include: { organization: true } },
        latestAssigneeCounter: true,
      },
    });

    if (!ticket) {
      throw this.businessException.NotFound('ticket');
    }

    // If a new counter is specified and it's different from the current one
    if (newCounterId && newCounterId !== ticket.latestAssigneeCounterId) {
      await this.googleTextToSpeechService.invalidateCache(queueId);

      const newCounter = await this.prisma.counter.findUnique({ where: { id: newCounterId } });
      if (!newCounter) {
        throw this.businessException.NotFound('new counter');
      }

      const callingText = `Nomor antrian: ${ticket.prefix} - ${ticket.queueNumber}; silahkan menuju, ke loket nomor, ${newCounter.counterNumber}`;
      const soundUrl = await this.googleTextToSpeechService.generateSound(callingText, queueId);

      ticket = await this.prisma.ticket.update({
        where: { id: queueId },
        data: { latestAssigneeCounterId: newCounterId, soundUrl, updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
        include: {
          service: { include: { organization: true } },
          latestAssigneeCounter: true,
        },
      });
    }

    const rooms = [`service-${ticket.serviceId}`, 'monitor-room'];
    this.broadcastService.emit('ticket:recalled', toTicketRecalledDTO(ticket), rooms);
    this.broadcastService.emit('ticket:called', toTicketCalledDTO(ticket), rooms);

    return ticket;
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

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { ...payload, updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
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
      const rooms = [`service-${updatedTicket.serviceId}`, 'monitor-room'];
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

  async cleanUpTicket(date) {
    const result = await this.prisma.ticket.deleteMany({
      where: {
        queueDate: {
          lt: date,
        },
      },
    });
    return result;
  }
}

module.exports = QueueService;
