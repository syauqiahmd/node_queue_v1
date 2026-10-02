const HealthController = require('../../../src/api/controllers/healthController');

describe('HealthController', () => {
  let mockHealthCheck;
  let healthController;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockHealthCheck = { getStatus: jest.fn() };
    healthController = new HealthController({ healthCheck: mockHealthCheck });
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('returns 200 with status ok when all dependencies are up', async () => {
    mockHealthCheck.getStatus.mockResolvedValue({
      healthy: true,
      checks: { database: 'up', redis: 'up' },
    });

    await healthController.check({}, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: {
        status: 'ok',
        checks: { database: 'up', redis: 'up' },
        uptimeSeconds: expect.any(Number),
      },
    });
  });

  it('returns 503 with status degraded when a dependency is down', async () => {
    mockHealthCheck.getStatus.mockResolvedValue({
      healthy: false,
      checks: { database: 'up', redis: 'down' },
    });

    await healthController.check({}, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: expect.objectContaining({ status: 'degraded' }),
      })
    );
  });

  it('passes unexpected errors to next', async () => {
    const error = new Error('unexpected');
    mockHealthCheck.getStatus.mockRejectedValue(error);

    await healthController.check({}, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
