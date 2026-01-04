const toTicketCalledDTO = require('../dto/websocket/TicketCalledDTO');
const toTicketResolvedDTO = require('../dto/websocket/TicketResolvedDTO');
const toTicketPrioritizedDTO = require('../dto/websocket/TicketPrioritizedDTO');
const toTicketRecalledDTO = require('../dto/websocket/TicketRecalledDTO');

class QueueService {
  constructor({
    prismaClient,
    businessException,
    googleTextToSpeechService,
    broadcastService,
    s3Client,
  }) {
    this.prisma = prismaClient;
    this.businessException = businessException;
    this.googleTextToSpeechService = googleTextToSpeechService;
    this.broadcastService = broadcastService;
    this.s3Service = s3Client;
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
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    today.setUTCHours(0, 0, 0, 0);

    const where = {
      serviceId,
      isCall: false,
      latestAssigneeCounterId: counterId || undefined, // Use undefined to ignore if not provided
      queueDate: today,
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
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    today.setUTCHours(0, 0, 0, 0);
    const where = {
      serviceId,
      isCall: false,
      queueDate: today,
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
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    today.setUTCHours(0, 0, 0, 0);

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
          AND "queue_date" = CAST(${today} AS date)
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
            AND "queue_date" = CAST(${today} AS date)
          ORDER BY "created_at" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;
        selectedId = Array.isArray(normalRow) && normalRow.length ? normalRow[0].id : null;
      }

      if (!selectedId) {
        throw this.businessException.NotFound('queue');
      }

      const updatedTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // Set update time (GMT+8)
      const updated = await tx.ticket.update({
        where: { id: selectedId },
        data: {
          isCall: true,
          calledAt: updatedTime, // Set call time (GMT+8)
          latestAssigneeCounterId: counterId,
          updatedAt: updatedTime, // Set update time (GMT+8)
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
      data: { soundUrl, updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
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
        data: {
          latestAssigneeCounterId: newCounterId,
          soundUrl,
          updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
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
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    today.setHours(0, 0, 0, 0); // Set to start of the day

    return await this.prisma.ticket.findUnique({
      where: {
        id,
        queueDate: today,
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

    const updateData = { ...payload, updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000) };

    // Set resolvedAt if ticket is being resolved
    if (payload.isResolved && !currentTicket.isResolved) {
      updateData.resolvedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
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
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const where = {
      isCall: true,
      isResolved: false,
      queueDate: today,
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
      data: { isPriority: true, updatedAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
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

  async cleanUpS3Files(dirName) {
    const result = await this.s3Service.deleteFilesInDirectory(dirName);
    return result;
  }

  async generateDailyStats(dateInput) {
    const dailyStatsData = await this.prisma.$queryRaw`
      SELECT
        s."organization_id" as "organizationId",
        t."service_id" as "serviceId",
        t."queue_date" as "date",
        COUNT(*)::int as "totalTickets",
        COUNT(*) FILTER (WHERE t."is_resolved" = true)::int as "resolvedTickets",
        COUNT(*) FILTER (WHERE t."is_call" = true AND t."is_resolved" = false)::int as "ticketsInProgress",
        COALESCE(AVG(EXTRACT(EPOCH FROM (t."called_at" - t."created_at"))/60), 0)::float as "avgWaitTime",
        COALESCE(MIN(EXTRACT(EPOCH FROM (t."called_at" - t."created_at"))/60), 0)::float as "minWaitTime",
        COALESCE(MAX(EXTRACT(EPOCH FROM (t."called_at" - t."created_at"))/60), 0)::float as "maxWaitTime",
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (t."called_at" - t."created_at"))/60), 0)::float as "medianWaitTime",
        COALESCE(MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM t."created_at")), 0)::int as "peakHour"
      FROM "Ticket" t
      JOIN "Service" s ON t."service_id" = s."id"
      WHERE t."queue_date" = CAST(${dateInput} AS DATE)
      GROUP BY s."organization_id", t."service_id", t."queue_date"
    `;

    let result = null;

    if (dailyStatsData && dailyStatsData.length > 0) {
      const timestamp = new Date(Date.now() + 8 * 60 * 60 * 1000);
      result = await this.prisma.dailyServiceStats.createMany({
        data: dailyStatsData.map((item) => ({
          ...item,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      });
    }

    return result;
  }
}

module.exports = QueueService;
