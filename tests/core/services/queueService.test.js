const QueueService = require('@src/core/services/queueService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('QueueService', () => {
  let queueService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
      ticket: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      counter: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaClient)), // Mock transaction
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };

    queueService = new QueueService({
      prismaClient,
      businessException,
    });
  });

  describe('getQueueListByServiceId', () => {
    it('should return a list of queues', async () => {
      const mockTickets = [{ id: 't1' }];
      prismaClient.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getQueueListByServiceId('s1', {});

      expect(prismaClient.ticket.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });

    it('should apply status filter for in-progress', async () => {
      const mockTickets = [{ id: 't1' }];
      prismaClient.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getQueueListByServiceId('s1', { status: 'in-progress' });

      expect(prismaClient.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isCall: true }),
        })
      );
      expect(result).toEqual(mockTickets);
    });

    it('should apply status filter for completed', async () => {
      const mockTickets = [{ id: 't1' }];
      prismaClient.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getQueueListByServiceId('s1', { status: 'completed' });

      expect(prismaClient.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isResolved: true }),
        })
      );
      expect(result).toEqual(mockTickets);
    });

    it('should apply counterId filter', async () => {
      const mockTickets = [{ id: 't1' }];
      prismaClient.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getQueueListByServiceId('s1', { counterId: 'c1' });

      expect(prismaClient.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ latestAssigneeCounterId: 'c1' }),
        })
      );
      expect(result).toEqual(mockTickets);
    });
  });

  describe('getTotalQueueByServiceId', () => {
    it('should return the total count of queues', async () => {
      prismaClient.ticket.count.mockResolvedValue(10);

      const result = await queueService.getTotalQueueByServiceId('s1');

      expect(prismaClient.ticket.count).toHaveBeenCalled();
      expect(result).toBe(10);
    });

    it('should apply status filter for in-progress', async () => {
      prismaClient.ticket.count.mockResolvedValue(5);

      const result = await queueService.getTotalQueueByServiceId('s1', 'in-progress');

      expect(prismaClient.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isCall: true }),
        })
      );
      expect(result).toBe(5);
    });

    it('should apply status filter for completed', async () => {
      prismaClient.ticket.count.mockResolvedValue(3);

      const result = await queueService.getTotalQueueByServiceId('s1', 'completed');

      expect(prismaClient.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isResolved: true }),
        })
      );
      expect(result).toBe(3);
    });
  });

  describe('callNextQueue', () => {
    it('should call the next queue and update ticket', async () => {
      const mockTicket = { id: 't1', serviceId: 's1', queueNumber: 1, prefix: 'A' };
      const mockCounter = { id: 'c1' };
      prismaClient.ticket.findFirst.mockResolvedValue(mockTicket);
      prismaClient.counter.findUnique.mockResolvedValue(mockCounter);
      prismaClient.ticket.update.mockResolvedValue({
        ...mockTicket,
        isCall: true,
        latestAssigneeCounterId: 'c1',
      });

      const result = await queueService.callNextQueue({ serviceId: 's1', counterId: 'c1' });

      expect(prismaClient.ticket.findFirst).toHaveBeenCalled();
      expect(prismaClient.counter.findUnique).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(prismaClient.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          data: { isCall: true, latestAssigneeCounterId: 'c1' },
        })
      );
      expect(result).toEqual({ ...mockTicket, isCall: true, latestAssigneeCounterId: 'c1' });
    });

    it('should throw NotFound error if no ticket is found', async () => {
      prismaClient.ticket.findFirst.mockResolvedValue(null);

      await expect(
        queueService.callNextQueue({ serviceId: 's1', counterId: 'c1' })
      ).rejects.toThrow(expect.any(BusinessError));
      expect(businessException.NotFound).toHaveBeenCalledWith('queue');
    });

    it('should throw NotFound error if counter does not exist', async () => {
      const mockTicket = { id: 't1', serviceId: 's1' };
      prismaClient.ticket.findFirst.mockResolvedValue(mockTicket);
      prismaClient.counter.findUnique.mockResolvedValue(null);

      await expect(
        queueService.callNextQueue({ serviceId: 's1', counterId: 'c1' })
      ).rejects.toThrow(expect.any(BusinessError));
      expect(businessException.NotFound).toHaveBeenCalledWith('Counter');
    });
  });

  describe('getCurrentQueueDetailById', () => {
    it('should return queue detail by ID', async () => {
      const mockTicket = { id: 't1' };
      prismaClient.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await queueService.getCurrentQueueDetailById('t1');

      expect(prismaClient.ticket.findUnique).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: 't1',
          createdAt: expect.any(Object),
        }),
        include: {
          service: {
            include: {
              organization: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTicket);
    });
  });

  describe('updateQueueById', () => {
    it('should update a queue by ID', async () => {
      const mockTicket = { id: 't1' };
      prismaClient.ticket.update.mockResolvedValue(mockTicket);

      const result = await queueService.updateQueueById('t1', { isCall: true });

      expect(prismaClient.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          data: { isCall: true },
        })
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getCallingQueue', () => {
    it('should return calling queues', async () => {
      const mockTickets = [{ id: 't1' }];
      prismaClient.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await queueService.getCallingQueue();

      expect(prismaClient.ticket.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });
  });

  describe('queueDetailById', () => {
    it('should return queue detail by ID', async () => {
      const mockTicket = { id: 't1' };
      prismaClient.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await queueService.queueDetailById('t1');

      expect(prismaClient.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
        include: {
          latestAssigneeCounter: true,
        },
      });
      expect(result).toEqual(mockTicket);
    });
  });
});
