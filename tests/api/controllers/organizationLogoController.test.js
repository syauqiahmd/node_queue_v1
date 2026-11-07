const OrganizationController = require('../../../src/api/controllers/organizationController');
const OrganizationServiceProxy = require('../../../src/core/services/OrganizationServiceProxy');

describe('OrganizationController.uploadLogo', () => {
  let controller;
  let mockService;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockService = { uploadLogo: jest.fn() };
    controller = new OrganizationController({
      organizationService: mockService,
      businessException: { BadRequest: jest.fn((msg) => new Error(msg)) },
      identityHelper: { getCurrentUserId: jest.fn(() => 'user-1') },
    });
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
  });

  it('passes the file buffer and current user to the service', async () => {
    const buffer = Buffer.from('img');
    mockService.uploadLogo.mockResolvedValue({ id: 'org-1', logoUrl: 'url' });

    await controller.uploadLogo(
      { params: { organizationId: 'org-1' }, file: { buffer } },
      mockRes,
      mockNext
    );

    expect(mockService.uploadLogo).toHaveBeenCalledWith('org-1', buffer, 'user-1');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'org-1', logoUrl: 'url' },
      message: 'Logo updated',
    });
  });

  it('returns BadRequest when no file was uploaded', async () => {
    await controller.uploadLogo({ params: { organizationId: 'org-1' } }, mockRes, mockNext);

    expect(mockService.uploadLogo).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toMatch(/Logo file is required/);
  });

  it('forwards service errors to next', async () => {
    const error = new Error('boom');
    mockService.uploadLogo.mockRejectedValue(error);

    await controller.uploadLogo(
      { params: { organizationId: 'org-1' }, file: { buffer: Buffer.from('x') } },
      mockRes,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe('OrganizationServiceProxy.uploadLogo', () => {
  it('calls the real service and clears organization-related caches', async () => {
    const real = { uploadLogo: jest.fn().mockResolvedValue({ id: 'org-1' }) };
    const cacheService = { del: jest.fn(), invalidate: jest.fn() };
    const proxy = new OrganizationServiceProxy({
      organizationServiceReal: real,
      cacheService,
      logger: { info: jest.fn() },
    });
    const buffer = Buffer.from('x');

    await expect(proxy.uploadLogo('org-1', buffer, 'user-1')).resolves.toEqual({ id: 'org-1' });

    expect(real.uploadLogo).toHaveBeenCalledWith('org-1', buffer, 'user-1');
    expect(cacheService.del).toHaveBeenCalledWith('organization:id:org-1');
    ['organization:', 'service:', 'counter:', 'user:'].forEach((prefix) =>
      expect(cacheService.invalidate).toHaveBeenCalledWith(prefix)
    );
  });
});
