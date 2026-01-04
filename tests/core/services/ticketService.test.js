const TicketService = require('../../../src/core/services/ticketService');

describe('TicketService', () => {
  let ticketService;
  let mockPrisma;
  let mockBusinessException;
  let mockBroadcastService;

  beforeEach(() => {
    // Mock Prisma Client
    mockPrisma = {
      service: {
        findUnique: jest.fn(),
      },
      ticket: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    // Mock Business Exception
    mockBusinessException = {
      NotFound: jest.fn((entity) => new Error(`${entity} not found`)),
    };

    // Mock Broadcast Service
    mockBroadcastService = {
      emit: jest.fn(),
    };

    // Initialize Service with mocks
    ticketService = new TicketService({
      prismaClient: mockPrisma,
      businessException: mockBusinessException,
      broadcastService: mockBroadcastService,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('generateQueueNumberAndCreateTicket', () => {
    it('should create a ticket successfully with correct queue number', async () => {
      // Arrange
      const serviceId = 'service-123';
      const mockService = { id: serviceId, prefix: 'A' };

      // Mock Date.now to a fixed time
      // 2025-12-31 16:50:30 GMT+8 (which is 2025-12-31 08:50:30 UTC)
      const mockNow = new Date('2025-12-31T08:50:30Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      // First ticket for the day
      mockPrisma.ticket.findFirst.mockResolvedValue(null);
      mockPrisma.ticket.count.mockResolvedValue(0);

      const mockCreatedTicket = {
        id: 'ticket-1',
        queueNumber: 1,
        prefix: 'A',
        serviceId,
        queueDate: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        service: {
          organization: { id: 'org-1' },
        },
      };
      mockPrisma.ticket.create.mockResolvedValue(mockCreatedTicket);

      // Act
      const result = await ticketService.generateQueueNumberAndCreateTicket({
        serviceId,
      });

      // Assert
      expect(mockPrisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: serviceId },
        select: { prefix: true },
      });

      // Check if today logic is correct
      // Logic in service:
      // const today = new Date(Date.now() + 8 * 60 * 60 * 1000);
      // today.setUTCHours(0, 0, 0, 0);

      // Expected 'today' calculation:
      // MockNow (08:50:30 UTC) + 8h = 16:50:30 UTC-value
      // setUTCHours(0,0,0,0) -> 00:00:00 UTC-value
      // Expected ISO: 2025-12-31T00:00:00.000Z
      const expectedToday = new Date('2025-12-31T00:00:00.000Z');

      expect(mockPrisma.ticket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            queueDate: expectedToday,
          }),
        })
      );

      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 1,
            prefix: 'A',
            queueDate: expectedToday,
            serviceId,
          }),
        })
      );

      expect(mockBroadcastService.emit).toHaveBeenCalledWith(
        'ticket:created',
        expect.objectContaining({
          id: 'ticket-1',
          queueNumber: 1,
          prefix: 'A',
          serviceId,
        }),
        [`service-${serviceId}`]
      );

      expect(result).toEqual({
        newTicket: mockCreatedTicket,
        totalWaitingQueue: { totalRecords: 0 },
      });
    });

    it('should increment queue number if previous ticket exists', async () => {
      // Arrange
      const serviceId = 'service-123';
      const mockService = { id: serviceId, prefix: 'B' };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      // Last ticket was number 5
      mockPrisma.ticket.findFirst.mockResolvedValue({ queueNumber: 5 });
      mockPrisma.ticket.count.mockResolvedValue(2);

      const mockCreatedTicket = {
        id: 'ticket-6',
        queueNumber: 6,
        prefix: 'B',
        serviceId,
      };
      mockPrisma.ticket.create.mockResolvedValue(mockCreatedTicket);

      // Act
      const result = await ticketService.generateQueueNumberAndCreateTicket({
        serviceId,
      });

      // Assert
      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 6, // 5 + 1
            prefix: 'B',
          }),
        })
      );

      expect(result.totalWaitingQueue.totalRecords).toBe(2);
    });

    it('should throw NotFound exception if service does not exist', async () => {
      // Arrange
      const serviceId = 'non-existent-service';
      mockPrisma.service.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ticketService.generateQueueNumberAndCreateTicket({
          serviceId,
        })
      ).rejects.toThrow('Service not found');

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Service');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
