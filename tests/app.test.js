const request = require('supertest');

const createApp = require('../src/app');
const container = require('../src/container');
const { asValue, asClass } = require('awilix');

describe('GET /test', () => {
  let app;
  let responseFormatter;

  beforeAll(() => {
    // Create a child container for the test to override dependencies
    const testContainer = container.createScope();

    // Mock socketManager for tests
    const mockSocketManager = {
      initSocket: jest.fn(),
      getIO: jest.fn().mockReturnValue({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      }),
    };
    testContainer.register({
      socket: asValue(mockSocketManager), // Register the mock as 'socket'
    });

    // Register broadcastService in the test container, so it uses the mocked socketManager
    testContainer.register({
      broadcastService: asClass(require('../src/core/services/broadcastService')).singleton(),
    });

    app = createApp(testContainer); // Pass the test container to createApp
    responseFormatter = testContainer.resolve('responseFormatter');
  });

  it('should return 200 OK with a message', async () => {
    // Temporarily add a test route to the app instance for this test
    app.get('/test', (req, res) => {
      return responseFormatter.successResponse(res, { message: 'Ready to serve' });
    });

    const res = await request(app).get('/test');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('message', 'Ready to serve');
  });
});
