const TicketController = require('../../../src/api/controllers/ticketController');

describe('TicketController', () => {
  let ticketController;
  let mockTicketService;
  let mockBroadcastService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockTicketService = {
      generateQueueNumberAndCreateTicket: jest.fn(),
      getQueuePosition: jest.fn(),
    };

    mockBroadcastService = {
      emit: jest.fn(),
    };

    mockReq = {
      body: { serviceId: 's-1' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    ticketController = new TicketController({
      ticketService: mockTicketService,
      broadcastService: mockBroadcastService,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create ticket and emit event', async () => {
      const newTicket = {
        id: 1,
        prefix: 'A',
        queueNumber: 5,
        service: {
          id: 's-1',
          name: 'Service 1',
          organization: {
            id: 'org-1',
            name: 'Org 1',
            fullName: 'Organization 1',
          },
        },
        createdAt: new Date(),
      };
      const totalWaitingQueue = { totalRecords: 2 };

      mockTicketService.generateQueueNumberAndCreateTicket.mockResolvedValue({
        newTicket,
        totalWaitingQueue,
      });

      await ticketController.create(mockReq, mockRes, mockNext);

      const expectedResponseData = {
        id: newTicket.id,
        queueNumber: 'A-005',
        serviceId: newTicket.service.id,
        serviceName: newTicket.service.name,
        organizationId: newTicket.service.organization.id,
        organizationName: newTicket.service.organization.name,
        organizationFullName: newTicket.service.organization.fullName,
        createdAt: newTicket.createdAt,
        totalWaitingQueue: 2,
      };

      expect(mockTicketService.generateQueueNumberAndCreateTicket).toHaveBeenCalledWith(
        mockReq.body
      );
      expect(mockBroadcastService.emit).toHaveBeenCalledWith('new-ticket', expectedResponseData, [
        'service-s-1',
        'monitor-room',
      ]);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResponseData,
        message: 'Created',
      });
    });

    it('should handle errors', async () => {
      mockTicketService.generateQueueNumberAndCreateTicket.mockRejectedValue(new Error('Error'));

      await ticketController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPosition', () => {
    it('should return the ticket position data', async () => {
      mockReq.params = { ticketId: 'ticket-1' };
      const positionData = {
        ticketId: 'ticket-1',
        serviceId: 's-1',
        queueNumber: 'A-005',
        status: 'waiting',
        peopleAhead: 3,
        queueRank: 4,
        totalWaiting: 12,
      };
      mockTicketService.getQueuePosition.mockResolvedValue(positionData);

      await ticketController.getPosition(mockReq, mockRes, mockNext);

      expect(mockTicketService.getQueuePosition).toHaveBeenCalledWith('ticket-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: positionData });
    });

    it('should handle errors', async () => {
      mockReq.params = { ticketId: 'ticket-1' };
      mockTicketService.getQueuePosition.mockRejectedValue(new Error('Ticket not found'));

      await ticketController.getPosition(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
