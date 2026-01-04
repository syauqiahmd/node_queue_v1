const ServiceController = require('../../../src/api/controllers/serviceController');

describe('ServiceController', () => {
  let serviceController;
  let mockServiceService;
  let mockBusinessException;
  let mockIdentityHelper;
  let mockLogger;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockServiceService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publicGetAll: jest.fn(),
      getDailyServiceStats: jest.fn(),
    };

    mockBusinessException = {
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockIdentityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue(1),
      getCurrentUserRole: jest.fn().mockReturnValue('ADMIN'),
      getCurrentUserOrganizationId: jest.fn().mockReturnValue('org-1'),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    serviceController = new ServiceController({
      serviceService: mockServiceService,
      businessException: mockBusinessException,
      identityHelper: mockIdentityHelper,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of services', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const data = [{ id: 1, name: 'S1' }];
      mockServiceService.getAll.mockResolvedValue(data);

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(mockServiceService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockServiceService.getAll.mockRejectedValue(error);

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return service by id', async () => {
      mockReq.params.serviceId = 's-1';
      const data = { id: 's-1', name: 'S1' };
      mockServiceService.getById.mockResolvedValue(data);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockServiceService.getById).toHaveBeenCalledWith('s-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should throw NotFound if service not found', async () => {
      mockReq.params.serviceId = 's-1';
      mockServiceService.getById.mockResolvedValue(null);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Service');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      const error = new Error('Service error');
      mockServiceService.getById.mockRejectedValue(error);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create service', async () => {
      mockReq.body = { name: 'S1' };
      const data = { id: 1, name: 'S1' };
      mockServiceService.create.mockResolvedValue(data);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(mockServiceService.create).toHaveBeenCalledWith({
        name: 'S1',
        createdBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'S1' };
      const error = new Error('Service error');
      mockServiceService.create.mockRejectedValue(error);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update service', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.body = { name: 'S2' };
      const data = { id: 's-1', name: 'S2' };
      mockServiceService.update.mockResolvedValue(data);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(mockServiceService.update).toHaveBeenCalledWith('s-1', {
        name: 'S2',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.body = { name: 'S2' };
      const error = new Error('Service error');
      mockServiceService.update.mockRejectedValue(error);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('should remove service', async () => {
      mockReq.params.serviceId = 's-1';
      const data = { id: 's-1' };
      mockServiceService.remove.mockResolvedValue(data);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(mockServiceService.remove).toHaveBeenCalledWith('s-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Deleted' });
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      const error = new Error('Service error');
      mockServiceService.remove.mockRejectedValue(error);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('publicServiceList', () => {
    it('should return public service list formatted', async () => {
      const data = [
        {
          id: 1,
          name: 'S1',
          prefix: 'A',
          organization: {
            id: 'org-1',
            name: 'Org 1',
            fullName: 'Organization 1',
            logoUrl: 'https://logo.url',
          },
        },
      ];
      mockServiceService.publicGetAll.mockResolvedValue({ totalRecord: 1, data });

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockServiceService.publicGetAll).toHaveBeenCalledWith({ isActive: 'true' }, false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalRecord: 1,
          data: [
            {
              id: 1,
              name: 'S1',
              prefix: 'A',
              organization: {
                id: 'org-1',
                name: 'Org 1',
                fullName: 'Organization 1',
                logoUrl: 'https://logo.url',
              },
            },
          ],
        },
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockServiceService.publicGetAll.mockRejectedValue(error);

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return null for logoUrl if not present', async () => {
      const data = [
        {
          id: 1,
          name: 'S1',
          prefix: 'A',
          organization: {
            id: 'org-1',
            name: 'Org 1',
            fullName: 'Organization 1',
            // No logoUrl
          },
        },
      ];
      mockServiceService.publicGetAll.mockResolvedValue({ totalRecord: 1, data });

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                organization: expect.objectContaining({
                  logoUrl: null,
                }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('exportDailyServiceStatsReport', () => {
    it('should return CSV for ADMIN without org restriction', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('ADMIN');
      const payload = {
        serviceId: 's-1',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };
      mockReq.body = payload;
      const rows = [
        {
          date: new Date('2025-12-01'),
          serviceId: 's-1',
          organizationId: 'org-1',
          totalTickets: 10,
          resolvedTickets: 7,
          ticketsInProgress: 3,
          avgWaitTime: 5.5,
          minWaitTime: 1.2,
          maxWaitTime: 12.3,
          medianWaitTime: 4.1,
          peakHour: 11,
          service: { name: 'Layanan A' },
          organization: { name: 'Organisasi X' },
        },
        {
          date: new Date('2025-12-02'),
          serviceId: 's-1',
          organizationId: 'org-1',
          totalTickets: 8,
          resolvedTickets: 6,
          ticketsInProgress: 2,
          avgWaitTime: 6.2,
          minWaitTime: 2.0,
          maxWaitTime: 10.0,
          medianWaitTime: 5.0,
          peakHour: 13,
          service: { name: 'Layanan A' },
          organization: { name: 'Organisasi X' },
        },
      ];
      mockServiceService.getDailyServiceStats.mockResolvedValue(rows);

      await serviceController.exportDailyServiceStatsReport(mockReq, mockRes, mockNext);

      expect(mockServiceService.getDailyServiceStats).toHaveBeenCalledWith({
        serviceId: 's-1',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        organizationId: undefined,
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=laporan_antrian_2025-12-01_2025-12-31.csv'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      const expectedCsv =
        [
          'no,tanggal,organisasi,layanan,total_antrian,antrian_selesai,antrian_diproses,rata_rata_waktu_tunggu,waktu_tunggu_minimum,waktu_tunggu_maksimum,median_waktu_tunggu,jam_puncak',
          '1,2025-12-01,Organisasi X,Layanan A,10,7,3,5.50 menit,1.20 menit,12.30 menit,4.10 menit,11',
          '2,2025-12-02,Organisasi X,Layanan A,8,6,2,6.20 menit,2.00 menit,10.00 menit,5.00 menit,13',
        ].join('\n') + '\n';
      expect(mockRes.send).toHaveBeenCalledWith(expectedCsv);
    });

    it('should restrict by organization for USER', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('USER');
      mockIdentityHelper.getCurrentUserOrganizationId.mockReturnValue('org-42');
      const payload = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };
      mockReq.body = payload;
      mockServiceService.getDailyServiceStats.mockResolvedValue([
        {
          date: new Date('2025-12-01'),
          totalTickets: 1,
          resolvedTickets: 1,
          ticketsInProgress: 0,
          avgWaitTime: 1,
          minWaitTime: 1,
          maxWaitTime: 1,
          medianWaitTime: 1,
          peakHour: 9,
          service: { name: 'Layanan B' },
          organization: { name: 'Organisasi Y' },
        },
      ]);

      await serviceController.exportDailyServiceStatsReport(mockReq, mockRes, mockNext);

      expect(mockServiceService.getDailyServiceStats).toHaveBeenCalledWith({
        serviceId: undefined,
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        organizationId: 'org-42',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should throw NotFound when no data', async () => {
      mockReq.body = { startDate: '2025-12-01' };
      const error = new Error('Not found');
      mockServiceService.getDailyServiceStats.mockResolvedValue([]);
      mockBusinessException = {
        NotFound: jest.fn(() => error),
      };
      // Recreate controller with updated businessException mock
      serviceController = new (require('../../../src/api/controllers/serviceController'))({
        serviceService: mockServiceService,
        businessException: mockBusinessException,
        identityHelper: mockIdentityHelper,
        logger: mockLogger,
      });

      await serviceController.exportDailyServiceStatsReport(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('DailyServiceStats');
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should render empty names when relations missing', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('ADMIN');
      mockReq.body = { startDate: '2025-12-15' };
      mockServiceService.getDailyServiceStats.mockResolvedValue([
        {
          date: new Date('2025-12-15'),
          totalTickets: 5,
          resolvedTickets: 3,
          ticketsInProgress: 2,
          avgWaitTime: 4.5,
          minWaitTime: 1.0,
          maxWaitTime: 9.0,
          medianWaitTime: 4.0,
          peakHour: 10,
          // service, organization omitted
        },
      ]);

      await serviceController.exportDailyServiceStatsReport(mockReq, mockRes, mockNext);

      const expectedCsv =
        [
          'no,tanggal,organisasi,layanan,total_antrian,antrian_selesai,antrian_diproses,rata_rata_waktu_tunggu,waktu_tunggu_minimum,waktu_tunggu_maksimum,median_waktu_tunggu,jam_puncak',
          '1,2025-12-15,,,' + '5,3,2,4.50 menit,1.00 menit,9.00 menit,4.00 menit,10', // empty org and service
        ].join('\n') + '\n';
      expect(mockRes.send).toHaveBeenCalledWith(expectedCsv);
    });

    it('should default endDate to startDate when missing', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('ADMIN');
      const payload = {
        startDate: '2025-12-20',
      };
      mockReq.body = payload;
      const rows = [
        {
          date: new Date('2025-12-20'),
          totalTickets: 3,
          resolvedTickets: 2,
          ticketsInProgress: 1,
          avgWaitTime: 3.5,
          minWaitTime: 1.0,
          maxWaitTime: 7.0,
          medianWaitTime: 3.0,
          peakHour: 14,
          service: { name: 'Layanan C' },
          organization: { name: 'Organisasi Z' },
        },
      ];
      mockServiceService.getDailyServiceStats.mockResolvedValue(rows);

      await serviceController.exportDailyServiceStatsReport(mockReq, mockRes, mockNext);

      expect(mockServiceService.getDailyServiceStats).toHaveBeenCalledWith({
        serviceId: undefined,
        startDate: '2025-12-20',
        endDate: '2025-12-20',
        organizationId: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=laporan_antrian_2025-12-20_2025-12-20.csv'
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        [
          'no,tanggal,organisasi,layanan,total_antrian,antrian_selesai,antrian_diproses,rata_rata_waktu_tunggu,waktu_tunggu_minimum,waktu_tunggu_maksimum,median_waktu_tunggu,jam_puncak',
          '1,2025-12-20,Organisasi Z,Layanan C,3,2,1,3.50 menit,1.00 menit,7.00 menit,3.00 menit,14',
        ].join('\n') + '\n'
      );
    });
  });
});
