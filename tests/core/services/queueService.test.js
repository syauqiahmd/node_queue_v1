const QueueService = require('../../../src/core/services/queueService');

describe('QueueService', () => {
  let queueService;
  let mockPrisma;
  let mockBusinessException;
  let mockGoogleTextToSpeechService;
  let mockBroadcastService;

  beforeEach(() => {
    mockPrisma = {
      ticket: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      counter: {
        findUnique: jest.fn(),
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

    queueService = new QueueService({
      prismaClient: mockPrisma,
      businessException: mockBusinessException,
      googleTextToSpeechService: mockGoogleTextToSpeechService,
      broadcastService: mockBroadcastService,
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

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ serviceId, isCall: false }),
        orderBy: { createdAt: 'asc' },
      }));
      expect(result).toEqual(mockTickets);
    });

    it('should apply status filter', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      await queueService.getQueueListByServiceId(serviceId, { status: 'in-progress' });

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isCall: true,
          isResolved: false
        })
      }));
    });
  });

  describe('getTotalQueueByServiceId', () => {
    it('should return count of tickets', async () => {
      const serviceId = 'service-1';
      mockPrisma.ticket.count.mockResolvedValue(5);

      const result = await queueService.getTotalQueueByServiceId(serviceId);

      expect(mockPrisma.ticket.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ serviceId, isCall: false }),
      }));
      expect(result).toBe(5);
    });
  });

  describe('callNextQueue', () => {
    it('should call the next priority ticket if available', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1' };
      
      mockPrisma.counter.findUnique.mockResolvedValue({ id: 'counter-1', counterNumber: 1 });
      
      // Mock raw query results for priority
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'ticket-prio' }]) // Priority query
        .mockResolvedValueOnce([]); // Normal query (should not be called if priority found)

      mockPrisma.ticket.update
        .mockResolvedValueOnce({ // First update (assign counter)
            id: 'ticket-prio', 
            prefix: 'A', 
            queueNumber: 1, 
            serviceId: 'service-1',
            latestAssigneeCounter: { counterNumber: 1 },
            service: { name: 'Service 1', organization: { name: 'Org 1' } }
        })
        .mockResolvedValueOnce({ // Second update (sound url)
            id: 'ticket-prio', 
            prefix: 'A', 
            queueNumber: 1, 
            serviceId: 'service-1',
            soundUrl: 'https://sound.url',
            latestAssigneeCounter: { counterNumber: 1 },
            service: { name: 'Service 1', organization: { name: 'Org 1' } }
        });

      mockGoogleTextToSpeechService.generateSound.mockResolvedValue('https://sound.url');

      const result = await queueService.callNextQueue(payload);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1); // Only priority check needed
      expect(mockGoogleTextToSpeechService.generateSound).toHaveBeenCalled();
      expect(mockBroadcastService.emit).toHaveBeenCalledWith('ticket:called', expect.any(Object), expect.any(Array));
      expect(result.soundUrl).toBe('https://sound.url');
    });

    it('should call normal ticket if no priority ticket', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1' };
      
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
        service: { name: 'Service 1', organization: { name: 'Org 1' } }
      });

      await queueService.callNextQueue(payload);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should throw if no ticket found', async () => {
      const payload = { serviceId: 'service-1', counterId: 'counter-1' };
      mockPrisma.counter.findUnique.mockResolvedValue({ id: 'counter-1' });
      mockPrisma.$queryRaw.mockResolvedValue([]); // Both return empty

      await expect(queueService.callNextQueue(payload)).rejects.toThrow('queue not found');
    });
  });

  describe('recallTicket', () => {
    it('should recall ticket and generate new sound if counter changed', async () => {
      const queueId = 'ticket-1';
      const newCounterId = 'counter-2';
      
      const mockTicket = {
        id: queueId,
        latestAssigneeCounterId: 'counter-1',
        prefix: 'A',
        queueNumber: 1,
        serviceId: 'service-1',
        service: { name: 'Service 1', organization: { id: 'org-1', name: 'Org 1' } }
      };
      
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.counter.findUnique.mockResolvedValue({ id: newCounterId, counterNumber: 2 });
      mockGoogleTextToSpeechService.generateSound.mockResolvedValue('new-sound-url');
      
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        latestAssigneeCounterId: newCounterId,
        soundUrl: 'new-sound-url',
        latestAssigneeCounter: { counterNumber: 2 },
        service: { name: 'Service 1', organization: { id: 'org-1', name: 'Org 1' } }
      });

      await queueService.recallTicket(queueId, newCounterId);

      expect(mockGoogleTextToSpeechService.invalidateCache).toHaveBeenCalledWith(queueId);
      expect(mockGoogleTextToSpeechService.generateSound).toHaveBeenCalled();
      expect(mockPrisma.ticket.update).toHaveBeenCalled();
      expect(mockBroadcastService.emit).toHaveBeenCalledTimes(2); // recalled + called
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
          prefix: 'A'
        };
        
        mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
  
        await queueService.recallTicket(queueId, sameCounterId);
  
        expect(mockGoogleTextToSpeechService.generateSound).not.toHaveBeenCalled();
        expect(mockPrisma.ticket.update).not.toHaveBeenCalled();
        expect(mockBroadcastService.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateQueueById', () => {
      it('should update ticket and broadcast if resolved', async () => {
          const id = 'ticket-1';
          const payload = { isResolved: true };
          
          mockPrisma.ticket.findUnique.mockResolvedValue({ id });
          mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isResolved: true });

          await queueService.updateQueueById(id, payload);

          expect(mockPrisma.ticket.update).toHaveBeenCalled();
          expect(mockBroadcastService.emit).toHaveBeenCalledWith('ticket:resolved', expect.any(Object), expect.any(Array));
      });
  });

  describe('prioritizeTicket', () => {
      it('should update ticket to priority and broadcast', async () => {
          const id = 'ticket-1';
          mockPrisma.ticket.findUnique.mockResolvedValue({ id, serviceId: 'service-1' });
          mockPrisma.ticket.update.mockResolvedValue({ id, serviceId: 'service-1', isPriority: true });

          await queueService.prioritizeTicket(id);

          expect(mockPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
              where: { id },
              data: { isPriority: true }
          }));
          expect(mockBroadcastService.emit).toHaveBeenCalledWith('ticket:prioritized', expect.any(Object), expect.any(Array));
      });
  });
});
