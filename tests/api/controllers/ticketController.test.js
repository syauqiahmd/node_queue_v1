const TicketController = require('@src/api/controllers/ticketController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('TicketController', () => {
  let ticketController;
  let ticketService;
  let businessException;
  let broadcastService;

  beforeEach(() => {
    ticketService = {
      generateQueueNumberAndCreateTicket: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };
    broadcastService = {
      createTicketEvent: jest.fn(),
    };

    ticketController = new TicketController({
      ticketService,
      businessException,
      broadcastService,
    });
  });

  describe('create', () => {
    const mockReq = {
      body: { serviceId: 'service123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should create a new ticket', async () => {
      const newTicket = {
        id: 'newTicketId',
        prefix: 'S1',
        queueNumber: 101,
        createdAt: new Date(),
        service: {
          id: 'service123',
          name: 'Service Name',
          organization: {
            id: 'org123',
            name: 'Org Name',
            fullName: 'Organization Full Name',
          },
        },
      };
      const totalWaitingQueue = { totalRecords: 5 };
      ticketService.generateQueueNumberAndCreateTicket.mockResolvedValue({
        newTicket,
        totalWaitingQueue,
      });

      await ticketController.create(mockReq, mockRes, mockNext);

      expect(ticketService.generateQueueNumberAndCreateTicket).toHaveBeenCalledWith({
        serviceId: 'service123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: newTicket.id,
          queueNumber: `${newTicket.prefix}-${String(newTicket.queueNumber).padStart(3, '0')}`,
          serviceId: newTicket.service.id,
          serviceName: newTicket.service.name,
          organizationId: newTicket.service.organization.id,
          organizationName: newTicket.service.organization.name,
          organizationFullName: newTicket.service.organization.fullName,
          createdAt: newTicket.createdAt,
          totalWaitingQueue: totalWaitingQueue.totalRecords,
        },
        message: 'Created',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      ticketService.generateQueueNumberAndCreateTicket.mockRejectedValue(mockError);

      await ticketController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
