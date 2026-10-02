const QueueService = require('../../../src/core/services/queueService');
const TicketService = require('../../../src/core/services/ticketService');

const service = {
  id: 's-1',
  name: 'Customer Service',
  prefix: 'A',
  organization: { name: 'Dukcapil' },
};

describe('ticket event logging', () => {
  let logger;
  let prisma;
  let queueService;

  beforeEach(() => {
    logger = { info: jest.fn() };
    prisma = {
      service: { findUnique: jest.fn() },
      counter: { findUnique: jest.fn() },
      ticket: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
      $queryRaw: jest.fn(),
    };
    queueService = new QueueService({
      prismaClient: prisma,
      businessException: { NotFound: (e) => new Error(e) },
      googleTextToSpeechService: {
        generateSound: jest.fn().mockResolvedValue('url'),
        invalidateCache: jest.fn(),
      },
      broadcastService: { emit: jest.fn() },
      s3Client: {},
      logger,
    });
  });

  const eventMeta = (event) =>
    logger.info.mock.calls.find(([msg]) => msg === `Ticket event: ${event}`)?.[1];

  it('created: logs the queue length when the ticket was taken', async () => {
    const ticketService = new TicketService({
      prismaClient: prisma,
      businessException: {},
      broadcastService: { emit: jest.fn() },
      logger,
    });
    prisma.service.findUnique.mockResolvedValue({ prefix: 'A' });
    prisma.ticket.findFirst.mockResolvedValue(null);
    prisma.ticket.count.mockResolvedValue(4);
    prisma.ticket.create.mockResolvedValue({
      id: 't-1',
      serviceId: 's-1',
      service,
      isPriority: false,
    });

    await ticketService.generateQueueNumberAndCreateTicket({ serviceId: 's-1' });

    expect(eventMeta('created')).toEqual(
      expect.objectContaining({ ticketId: 't-1', serviceName: 'Customer Service', waitingCount: 4 })
    );
  });

  it('called: logs the wait time from creation to call', async () => {
    const called = {
      id: 't-1',
      serviceId: 's-1',
      service,
      isPriority: false,
      prefix: 'A',
      queueNumber: 1,
      latestAssigneeCounter: { counterNumber: 'A1' },
      createdAt: new Date('2026-10-03T10:00:00Z'),
      calledAt: new Date('2026-10-03T10:07:30Z'),
    };
    prisma.counter.findUnique.mockResolvedValue({ id: 'c-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 't-1' }]);
    prisma.ticket.update.mockResolvedValue(called);

    await queueService.callNextQueue({ serviceId: 's-1', counterId: 'c-1', caller: {} });

    expect(eventMeta('called')).toEqual(
      expect.objectContaining({ counterNumber: 'A1', waitSeconds: 450 })
    );
  });

  it('resolved: logs serving and total time, using the counter already loaded', async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: 't-1',
      isResolved: false,
      latestAssigneeCounter: { counterNumber: 'B2' },
    });
    prisma.ticket.update.mockImplementation(({ data }) => ({
      id: 't-1',
      serviceId: 's-1',
      service,
      isPriority: false,
      createdAt: new Date('2026-10-03T10:00:00Z'),
      calledAt: new Date('2026-10-03T10:05:00Z'),
      resolvedAt: data.resolvedAt,
    }));
    jest.useFakeTimers().setSystemTime(new Date('2026-10-03T10:08:00Z'));

    await queueService.updateQueueById('t-1', { isResolved: true });

    const meta = eventMeta('resolved');
    expect(meta.counterNumber).toBe('B2');
    expect(meta.serviceSeconds).toBe(meta.totalSeconds - 300);
    expect(meta.serviceSeconds).toBeGreaterThan(0);
    jest.useRealTimers();
  });

  it('resolved: does not log again for a ticket that was already resolved', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't-1', isResolved: true });
    prisma.ticket.update.mockResolvedValue({ id: 't-1', serviceId: 's-1', service });

    await queueService.updateQueueById('t-1', { isResolved: true });

    expect(eventMeta('resolved')).toBeUndefined();
  });

  it('recalled and prioritized are logged', async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: 't-1',
      serviceId: 's-1',
      service,
      latestAssigneeCounterId: 'c-1',
      latestAssigneeCounter: { counterNumber: 'A1' },
    });
    await queueService.recallTicket('t-1', 'c-1', {});
    prisma.ticket.update.mockResolvedValue({ id: 't-1', serviceId: 's-1', isPriority: true });
    await queueService.prioritizeTicket('t-1');

    expect(eventMeta('recalled')).toEqual(expect.objectContaining({ counterNumber: 'A1' }));
    expect(eventMeta('prioritized')).toEqual(expect.objectContaining({ isPriority: true }));
  });
});
