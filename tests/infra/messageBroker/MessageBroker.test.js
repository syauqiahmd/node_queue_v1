jest.mock('redis', () => ({
  createClient: jest.fn(() => {
    const handlers = {};
    return {
      handlers,
      on: jest.fn((event, fn) => {
        handlers[event] = fn;
      }),
      isOpen: true,
      connect: jest.fn().mockResolvedValue(),
      quit: jest.fn().mockResolvedValue('OK'),
      destroy: jest.fn(),
    };
  }),
}));
jest.mock('../../../src/infra/utils/log.helper', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const MessageBroker = require('../../../src/infra/messageBroker/MessageBroker');

describe('MessageBroker.close', () => {
  let broker;

  beforeEach(() => {
    broker = new MessageBroker();
  });

  it('quits both clients', async () => {
    await broker.close();
    expect(broker.publisher.quit).toHaveBeenCalled();
    expect(broker.subscriber.quit).toHaveBeenCalled();
  });

  it('destroys a client whose quit fails instead of rejecting', async () => {
    broker.publisher.quit.mockRejectedValueOnce(new Error('read ECONNRESET'));

    await expect(broker.close()).resolves.toBeUndefined();
    expect(broker.publisher.destroy).toHaveBeenCalled();
    expect(broker.subscriber.quit).toHaveBeenCalled();
  });

  it('does not reconnect the subscriber after close', async () => {
    await broker.close();
    broker.subscriber.isOpen = false;
    broker.subscriber.handlers.end();
    broker.subscriber.handlers.error(new Error('Socket closed unexpectedly'));
    await new Promise(setImmediate);

    expect(broker.subscriber.connect).not.toHaveBeenCalled();
  });
});
