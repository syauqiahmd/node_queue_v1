const TicketService = require('@src/core/services/ticketService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('TicketService', () => {
  let ticketService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
      service: {
        findUnique: jest.fn(),
      },
      ticket: {
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaClient)),
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };

    ticketService = new TicketService({
      prismaClient,
      businessException,
    });
  });

  describe('generateQueueNumberAndCreateTicket', () => {
    const mockServiceId = 'service123';
    const mockUpdatedBy = 'testuser';
    const mockLatestAssigneeCounterId = 'counter123';

    it('should generate a new queue number and create a ticket', async () => {
      const mockService = { id: mockServiceId, prefix: 'A' };
      const mockLastTicket = { queueNumber: 5 };
      const mockNewTicket = {
        id: 'newTicketId',
        queueNumber: 6,
        prefix: 'A',
        serviceId: mockServiceId,
      };

      prismaClient.service.findUnique.mockResolvedValue(mockService);
      prismaClient.ticket.findFirst.mockResolvedValue(mockLastTicket);
      prismaClient.ticket.count.mockResolvedValue(10);
      prismaClient.ticket.create.mockResolvedValue(mockNewTicket);

      const result = await ticketService.generateQueueNumberAndCreateTicket({
        serviceId: mockServiceId,
        updatedBy: mockUpdatedBy,
        latestAssigneeCounterId: mockLatestAssigneeCounterId,
      });

      expect(prismaClient.service.findUnique).toHaveBeenCalledWith({
        where: { id: mockServiceId },
        select: { prefix: true },
      });
      expect(prismaClient.$transaction).toHaveBeenCalled();
      expect(prismaClient.ticket.findFirst).toHaveBeenCalled();
      expect(prismaClient.ticket.count).toHaveBeenCalled();
      expect(prismaClient.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 6,
            prefix: 'A',
            serviceId: mockServiceId,
            updatedBy: mockUpdatedBy,
            latestAssigneeCounterId: mockLatestAssigneeCounterId,
          }),
        })
      );
      expect(result).toEqual({ newTicket: mockNewTicket, totalWaitingQueue: { totalRecords: 10 } });
    });

    it('should generate queue number 1 if no last ticket exists', async () => {
      const mockService = { id: mockServiceId, prefix: 'B' };
      const mockNewTicket = {
        id: 'newTicketId',
        queueNumber: 1,
        prefix: 'B',
        serviceId: mockServiceId,
      };

      prismaClient.service.findUnique.mockResolvedValue(mockService);
      prismaClient.ticket.findFirst.mockResolvedValue(null);
      prismaClient.ticket.count.mockResolvedValue(0);
      prismaClient.ticket.create.mockResolvedValue(mockNewTicket);

      const result = await ticketService.generateQueueNumberAndCreateTicket({
        serviceId: mockServiceId,
      });

      expect(prismaClient.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 1,
            prefix: 'B',
          }),
        })
      );
      expect(result).toEqual({ newTicket: mockNewTicket, totalWaitingQueue: { totalRecords: 0 } });
    });

    it('should throw NotFound error if service does not exist', async () => {
      prismaClient.service.findUnique.mockResolvedValue(null);

      await expect(
        ticketService.generateQueueNumberAndCreateTicket({ serviceId: mockServiceId })
      ).rejects.toThrow(expect.any(BusinessError));
      expect(businessException.NotFound).toHaveBeenCalledWith('Service');
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      prismaClient.service.findUnique.mockResolvedValue({ id: mockServiceId, prefix: 'A' });
      prismaClient.$transaction.mockImplementation(async () => {
        throw mockError;
      });

      await expect(
        ticketService.generateQueueNumberAndCreateTicket({ serviceId: mockServiceId })
      ).rejects.toThrow(mockError);
    });
  });
});
