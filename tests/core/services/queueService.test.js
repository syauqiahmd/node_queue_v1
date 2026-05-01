const QueueService = require('../../../src/core/services/queueService');

describe('QueueService', () => {
  let queueService;
  let mockPrisma;
  let mockBusinessException;
  let mockGoogleTextToSpeechService;
  let mockBroadcastService;
  let mockS3Client;

  beforeEach(() => {
    mockPrisma = {
      ticket: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      counter: {
        findUnique: jest.fn(),
      },
      dailyServiceStats: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
      $queryRaw: jest.fn(),
    };

    mockBusinessException = {
      NotFound: jest.fn((entity) => new Error(`${entity} not found`)),
    };

    mockGoogleTextToSpeechService = {
      generateSound: jest.fn(),
      invalidateCache: jest.fn(),
    };

    mockBroadcastService = {
      emit: jest.fn(),
    };

    mockS3Client = {
      deleteFilesInDirectory: jest.fn(),
    };

    queueService = new QueueService({
      prismaClient: mockPrisma,
      businessException: mockBusinessException,
      googleTextToSpeechService: mockGoogleTextToSpeechService,
      broadcastService: mockBroadcastService,
      s3Client: mockS3Client,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('getQueueListByServiceId', () => {
    it('should return list of tickets', async () => {
      const serviceId = 'service-1';
      const mockTickets = [{ id: 1 }, { id: 2 }];
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getQueueListByServiceId(serviceId, {});

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ serviceId, isCall: false }),
          orderBy: { createdAt: 'asc' },
        })
      );
      expect(result).toEqual(mockTickets);
    });

    it('should apply status filter', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await queueService.getQueueListByServiceId(serviceId, { status: 'in-progress' });

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isCall: true,
            isResolved: false,
          }),
        })
      );
    });

    it('should apply completed status filter', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await queueService.getQueueListByServiceId(serviceId, { status: 'completed' });

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isResolved: true,
          }),
        })
      );
      const callArgs = mockPrisma.ticket.findMany.mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('isCall');
    });
  });

  describe('getTotalQueueByServiceId', () => {
    it('should return count of tickets', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.count.mockResolvedValue(5);

      const result = await queueService.getTotalQueueByServiceId(serviceId);

      expect(mockPrisma.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ serviceId, isCall: false }),
        })
      );
      expect(result).toBe(5);
    });

    it('should apply status filter', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.count.mockResolvedValue(2);

      const result = await queueService.getTotalQueueByServiceId(serviceId, 'in-progress');

      expect(mockPrisma.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            serviceId,
            isCall: true,
            isResolved: false,
          }),
        })
      );
      expect(result).toBe(2);
    });
  });

  describe('callNextQueue', () => {
    it('should call the next priority ticket if available', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1', caller: { fullName: 'Ahmad Syauqi', userName: 'syauqi' } };

      mockPrisma.counter.findUnique.mockResolvedValue({ id: 'counter-1', counterNumber: 1 });

      // Mock raw query results for priority
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'ticket-prio' }]) // Priority query
        .mockResolvedValueOnce([]); // Normal query (should not be called if priority found)

      mockPrisma.ticket.update
        .mockResolvedValueOnce({
          // First update (assign counter)
          id: 'ticket-prio',
          prefix: 'A',
          queueNumber: 1,
          serviceId: 'service-1',
          latestAssigneeCounter: { counterNumber: 1 },
          service: { name: 'Service 1', organization: { name: 'Org 1' } },
        })
        .mockResolvedValueOnce({
          // Second update (sound url)
          id: 'ticket-prio',
          prefix: 'A',
          queueNumber: 1,
          serviceId: 'service-1',
          soundUrl: 'https://sound.url',
          latestAssigneeCounter: { counterNumber: 1 },
          service: { name: 'Service 1', organization: { name: 'Org 1' } },
        });

      mockGoogleTextToSpeechService.generateSound.mockResolvedValue('https://sound.url');

      const result = await queueService.callNextQueue(payload);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1); // Only priority check needed
      expect(mockGoogleTextToSpeechService.generateSound).toHaveBeenCalled();
      expect(mockBroadcastService.emit).toHaveBeenCalledWith(
        'ticket:called',
        expect.any(Object),
        expect.any(Array)
      );
      expect(result.soundUrl).toBe('https://sound.url');
    });

    it('should call normal ticket if no priority ticket', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1', caller: { fullName: 'Ahmad Syauqi' } };

      mockPrisma.counter.findUnique.mockResolvedValue({ id: 'counter-1', counterNumber: 1 });

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // Priority query empty
        .mockResolvedValueOnce([{ id: 'ticket-normal' }]); // Normal query found

      mockPrisma.ticket.update.mockResolvedValue({
        id: 'ticket-normal',
        prefix: 'A',
        queueNumber: 2,
        serviceId: 'service-1',
        latestAssigneeCounter: { counterNumber: 1 },
        soundUrl: 'https://sound.url',
        service: { name: 'Service 1', organization: { name: 'Org 1' } },
      });

      await queueService.callNextQueue(payload);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should throw if no ticket found', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1', caller: null };
      mockPrisma.counter.findUnique.mockResolvedValue({ id: 'counter-1' });
      mockPrisma.$queryRaw.mockResolvedValue([]); // Both return empty

      await expect(queueService.callNextQueue(payload)).rejects.toThrow('queue not found');
    });

    it('should throw if counter not found', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1', caller: null };
      mockPrisma.counter.findUnique.mockResolvedValue(null);

      await expect(queueService.callNextQueue(payload)).rejects.toThrow('Counter not found');
    });
  });

  describe('recallTicket', () => {
    const mockCaller = { fullName: 'Ahmad Syauqi', userName: 'syauqi' };

    it('should recall ticket and generate new sound if counter changed', async () => {
      const queueId = 'ticket-1';
      const newCounterId = 'counter-2';

      const mockTicket = {
        id: queueId,
        latestAssigneeCounterId: 'counter-1',
        prefix: 'A',
        queueNumber: 1,
        serviceId: 'service-1',
        service: { name: 'Service 1', organization: { id: 'org-1', name: 'Org 1' } },
      };

      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.counter.findUnique.mockResolvedValue({ id: newCounterId, counterNumber: 2 });
      mockGoogleTextToSpeechService.generateSound.mockResolvedValue('new-sound-url');

      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        latestAssigneeCounterId: newCounterId,
        soundUrl: 'new-sound-url',
        latestAssigneeCounter: { counterNumber: 2 },
        service: { name: 'Service 1', organization: { id: 'org-1', name: 'Org 1' } },
      });

      await queueService.recallTicket(queueId, newCounterId, mockCaller);

      expect(mockGoogleTextToSpeechService.invalidateCache).toHaveBeenCalledWith(queueId);
      expect(mockGoogleTextToSpeechService.generateSound).toHaveBeenCalled();
      expect(mockPrisma.ticket.update).toHaveBeenCalled();
      expect(mockBroadcastService.emit).toHaveBeenCalledTimes(2); // recalled + called
    });

    it('should throw if ticket not found', async () => {
      const queueId = 'ticket-1';
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      await expect(queueService.recallTicket(queueId, 'counter-2', mockCaller)).rejects.toThrow(
        'ticket not found'
      );
    });

    it('should throw if new counter not found', async () => {
      const queueId = 'ticket-1';
      const newCounterId = 'counter-2';
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: queueId,
        latestAssigneeCounterId: 'counter-1',
        serviceId: 'service-1',
      });
      mockPrisma.counter.findUnique.mockResolvedValue(null);

      await expect(queueService.recallTicket(queueId, newCounterId, mockCaller)).rejects.toThrow(
        'new counter not found'
      );
    });

    it('should just broadcast if counter is same', async () => {
      const queueId = 'ticket-1';
      const sameCounterId = 'counter-1';

      const mockTicket = {
        id: queueId,
        latestAssigneeCounterId: sameCounterId,
        serviceId: 'service-1',
        latestAssigneeCounter: { counterNumber: 1 },
        service: { name: 'Service 1', organization: { id: 'org-1', name: 'Org 1' } },
        queueNumber: 1,
        prefix: 'A',
      };

      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

      await queueService.recallTicket(queueId, sameCounterId, mockCaller);

      expect(mockGoogleTextToSpeechService.generateSound).not.toHaveBeenCalled();
      expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
      expect(mockBroadcastService.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateQueueById', () => {
    it('should update ticket and broadcast if resolved', async () => {
      const id = 'ticket-1';
      const payload = { isResolved: true };

      mockPrisma.ticket.findUnique.mockResolvedValue({ id, isResolved: false });
      mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isResolved: true });

      await queueService.updateQueueById(id, payload);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
        })
      );
      expect(mockBroadcastService.emit).toHaveBeenCalledWith(
        'ticket:resolved',
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should update ticket without broadcasting if not resolved', async () => {
      const id = 'ticket-1';
      const payload = { isResolved: false };

      mockPrisma.ticket.findUnique.mockResolvedValue({ id, isResolved: false });
      mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isResolved: false });

      await queueService.updateQueueById(id, payload);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ resolvedAt: expect.any(Date) }),
        })
      );
      expect(mockBroadcastService.emit).not.toHaveBeenCalled();
    });

    it('should not update resolvedAt if ticket is already resolved', async () => {
      const id = 'ticket-1';
      const payload = { isResolved: true };

      mockPrisma.ticket.findUnique.mockResolvedValue({ id, isResolved: true });
      mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isResolved: true });

      await queueService.updateQueueById(id, payload);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ resolvedAt: expect.any(Date) }),
        })
      );
      expect(mockBroadcastService.emit).toHaveBeenCalledWith(
        'ticket:resolved',
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should throw if ticket not found', async () => {
      const id = 'ticket-1';
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      await expect(queueService.updateQueueById(id, {})).rejects.toThrow('ticket not found');
    });
  });

  describe('prioritizeTicket', () => {
    it('should update ticket to priority and broadcast', async () => {
      const id = 'ticket-1';
      mockPrisma.ticket.findUnique.mockResolvedValue({ id, serviceId: 'service-1' });
      mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isPriority: true });

      await queueService.prioritizeTicket(id);

      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
          data: expect.objectContaining({ isPriority: true }),
        })
      );
      expect(mockBroadcastService.emit).toHaveBeenCalledWith(
        'ticket:prioritized',
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should throw if ticket not found', async () => {
      const id = 'ticket-1';
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      await expect(queueService.prioritizeTicket(id)).rejects.toThrow('ticket not found');
    });
  });

  describe('getCurrentQueueDetailById', () => {
    it('should return queue detail for current day', async () => {
      const id = 'ticket-1';
      const mockTicket = { id, serviceId: 'service-1' };
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await queueService.getCurrentQueueDetailById(id);

      expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id,
            queueDate: expect.any(Date),
          }),
        })
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getCallingQueue', () => {
    it('should return list of calling queues', async () => {
      const mockTickets = [{ id: 1 }, { id: 2 }];
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getCallingQueue();

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isCall: true,
            isResolved: false,
            queueDate: expect.any(Date),
          }),
          orderBy: { updatedAt: 'desc' },
          take: 4,
        })
      );
      expect(result).toEqual(mockTickets);
    });
  });

  describe('queueDetailById', () => {
    it('should return queue detail by id', async () => {
      const id = 'ticket-1';
      const mockTicket = { id, latestAssigneeCounter: { id: 'counter-1' } };
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await queueService.queueDetailById(id);

      expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
          include: { latestAssigneeCounter: true },
        })
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('cleanUpTicket', () => {
    it('should delete tickets older than given date', async () => {
      const date = new Date('2025-01-01');
      mockPrisma.ticket.deleteMany.mockResolvedValue({ count: 5 });

      const result = await queueService.cleanUpTicket(date);

      expect(mockPrisma.ticket.deleteMany).toHaveBeenCalledWith({
        where: {
          queueDate: {
            lt: date,
          },
        },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('cleanUpS3Files', () => {
    it('should delete files in given directory', async () => {
      const dirName = 'sound-generated/2025-01-01';
      mockS3Client.deleteFilesInDirectory.mockResolvedValue({ count: 10 });

      const result = await queueService.cleanUpS3Files(dirName);

      expect(mockS3Client.deleteFilesInDirectory).toHaveBeenCalledWith(dirName);
      expect(result).toEqual({ count: 10 });
    });
  });

  describe('generateDailyStats', () => {
    it('should generate and save daily stats when data exists', async () => {
      const dateInput = '2025-12-31';
      const mockStatsData = [
        {
          organizationId: 'org-1',
          serviceId: 'service-1',
          date: new Date('2025-12-31'),
          totalTickets: 10,
          resolvedTickets: 8,
          ticketsInProgress: 1,
          avgWaitTime: 5.5,
          minWaitTime: 1.0,
          maxWaitTime: 15.0,
          medianWaitTime: 4.0,
          peakHour: 14,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockStatsData);
      mockPrisma.dailyServiceStats.createMany.mockResolvedValue({ count: 1 });

      const result = await queueService.generateDailyStats(dateInput);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.dailyServiceStats.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            ...mockStatsData[0],
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        ]),
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should return null if no stats data found', async () => {
      const dateInput = '2025-12-31';
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await queueService.generateDailyStats(dateInput);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.dailyServiceStats.createMany).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
