const express = require('express');
const request = require('supertest');
const AccessLogMiddleware = require('../../../src/api/middlewares/accessLog');
const { asyncLocalStorage } = require('../../../src/infra/utils/asyncContext');

describe('AccessLogMiddleware', () => {
  let mockLogger;
  let app;
  let loggedTransactionIds;

  beforeEach(() => {
    loggedTransactionIds = [];
    const captureContext = () => {
      loggedTransactionIds.push(asyncLocalStorage.getStore()?.get('transactionId'));
    };
    mockLogger = {
      info: jest.fn(captureContext),
      debug: jest.fn(captureContext),
    };

    const accessLog = new AccessLogMiddleware({ logger: mockLogger }).accessLog;

    app = express();
    app.use((req, res, next) => {
      asyncLocalStorage.run(new Map([['transactionId', 'tx-1']]), next);
    });
    app.use(accessLog);

    const router = express.Router();
    router.get('/items/:id', (req, res) => res.status(200).json({ success: true }));
    router.get('/health', (req, res) => res.status(200).json({ success: true }));
    router.get('/boom', (req, res) => res.status(500).json({ success: false }));
    router.get('/fails/:id', (req, res, next) => next(new Error('fail')));
    app.use('/api/v1', router);
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => res.status(400).json({ success: false }));
  });

  it('logs method, route pattern, status and duration once per request', async () => {
    await request(app).get('/api/v1/items/123?x=1').expect(200);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    const [message, meta] = mockLogger.info.mock.calls[0];
    expect(message).toMatch(/^GET \/api\/v1\/items\/:id 200 [\d.]+ms$/);
    expect(meta).toEqual(
      expect.objectContaining({
        context: 'HTTP',
        method: 'GET',
        path: '/api/v1/items/123',
        route: '/api/v1/items/:id',
        statusCode: 200,
        durationMs: expect.any(Number),
      })
    );
  });

  it('runs the log inside the request async context', async () => {
    await request(app).get('/api/v1/items/1').expect(200);

    expect(loggedTransactionIds).toEqual(['tx-1']);
  });

  it('logs server errors with their status code', async () => {
    await request(app).get('/api/v1/boom').expect(500);

    expect(mockLogger.info.mock.calls[0][1].statusCode).toBe(500);
  });

  it('keeps the full route pattern when an error leaves the nested router', async () => {
    await request(app).get('/api/v1/fails/42').expect(400);

    expect(mockLogger.info.mock.calls[0][1].route).toBe('/api/v1/fails/:id');
  });

  it('logs unmatched routes by path', async () => {
    await request(app).get('/api/v1/missing').expect(404);

    const [message, meta] = mockLogger.info.mock.calls[0];
    expect(message).toMatch(/^GET \/api\/v1\/missing 404/);
    expect(meta.route).toBeUndefined();
  });

  it('logs health checks at debug level only', async () => {
    await request(app).get('/api/v1/health').expect(200);

    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).not.toHaveBeenCalled();
  });
});
