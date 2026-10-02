const WebSocket = require('ws');
const WebSocketServer = require('../../../src/infra/webSocket/WebSocketServer');

jest.mock('../../../src/infra/utils/log.helper', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('WebSocketServer', () => {
  let wsServer;
  let checks;
  let baseUrl;

  beforeEach(async () => {
    checks = { redis: 'up' };
    wsServer = new WebSocketServer(0, { handleMessage: jest.fn() }, { getChecks: () => checks });
    await new Promise((resolve) => wsServer.httpServer.once('listening', resolve));
    baseUrl = `http://localhost:${wsServer.httpServer.address().port}`;
  });

  afterEach(async () => {
    wsServer.server.clients.forEach((client) => client.terminate());
    await new Promise((resolve) => wsServer.server.close(resolve));
  });

  it('reports ok with the number of connected clients when dependencies are up', async () => {
    const client = new WebSocket(baseUrl.replace('http', 'ws'));
    await new Promise((resolve) => client.on('open', resolve));

    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      data: {
        status: 'ok',
        checks: { redis: 'up' },
        clients: 1,
        uptimeSeconds: expect.any(Number),
      },
    });
    client.close();
  });

  it('reports 503 when a dependency is down', async () => {
    checks = { redis: 'down' };

    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(503);
    expect((await res.json()).data.status).toBe('degraded');
  });

  it('keeps answering other plain HTTP requests with 426 Upgrade Required', async () => {
    const res = await fetch(`${baseUrl}/`);

    expect(res.status).toBe(426);
  });

  it('still accepts websocket connections and forwards messages to the gateway', async () => {
    const client = new WebSocket(baseUrl.replace('http', 'ws'));
    await new Promise((resolve) => client.on('open', resolve));
    client.send('{"event":"ping"}');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wsServer.webSocketGateway.handleMessage).toHaveBeenCalled();
    client.close();
  });
});
