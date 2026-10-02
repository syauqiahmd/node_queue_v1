const BroadcastService = require('../../../src/core/services/broadcastService');

describe('BroadcastService', () => {
  let broadcastService;
  let mockSocketManager;
  let mockLogger;
  let mockMessageBroker;
  let mockIO;

  beforeEach(() => {
    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocketManager = {
      getIO: jest.fn().mockReturnValue(mockIO),
    };

    mockLogger = {
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    mockMessageBroker = {
      publish: jest.fn(),
    };

    broadcastService = new BroadcastService({
      socket: mockSocketManager,
      logger: mockLogger,
      messageBroker: mockMessageBroker,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emit', () => {
    it('should emit event to rooms and log success', () => {
      const eventName = 'test-event';
      const data = { foo: 'bar' };
      const rooms = ['room-1'];

      broadcastService.emit(eventName, data, rooms);

      expect(mockSocketManager.getIO).toHaveBeenCalled();
      expect(mockIO.to).toHaveBeenCalledWith(rooms);
      expect(mockIO.emit).toHaveBeenCalledWith(eventName, data);
      expect(mockLogger.info).toHaveBeenCalledWith('Broadcast event sent successfully', {
        rooms,
        eventName,
      });
      expect(mockMessageBroker.publish).toHaveBeenCalledWith('websocket', {
        event: eventName,
        data,
      });
    });

    it('should warn and publish to broker if IO not initialized', () => {
      mockSocketManager.getIO.mockReturnValue(null);
      const eventName = 'test-event';
      const data = { foo: 'bar' };
      const rooms = ['room-1'];

      broadcastService.emit(eventName, data, rooms);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Socket.io not initialized'),
        { eventName }
      );
      expect(mockIO.emit).not.toHaveBeenCalled();
      expect(mockMessageBroker.publish).toHaveBeenCalledWith('websocket', {
        event: eventName,
        data,
      });
    });

    it('should warn and publish to broker if no rooms specified', () => {
      const eventName = 'test-event';
      const data = { foo: 'bar' };
      const rooms = [];

      broadcastService.emit(eventName, data, rooms);

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('no rooms specified'), {
        eventName,
      });
      expect(mockIO.emit).not.toHaveBeenCalled();
      expect(mockMessageBroker.publish).toHaveBeenCalledWith('websocket', {
        event: eventName,
        data,
      });
    });

    it('should handle emit errors gracefully', () => {
      const error = new Error('Emit failed');
      mockIO.to.mockImplementation(() => {
        throw error;
      });
      const eventName = 'test-event';
      const data = { foo: 'bar' };
      const rooms = ['room-1'];

      broadcastService.emit(eventName, data, rooms);

      expect(mockLogger.error).toHaveBeenCalledWith('Error during broadcasting event', {
        error,
        eventName,
      });
    });

    it('should work without messageBroker', () => {
      broadcastService = new BroadcastService({
        socket: mockSocketManager,
        logger: mockLogger,
      });

      const eventName = 'test-event';
      const data = { foo: 'bar' };
      const rooms = ['room-1'];

      broadcastService.emit(eventName, data, rooms);

      expect(mockMessageBroker.publish).not.toHaveBeenCalled();
    });

    it('should use default rooms empty array and warn', () => {
      const eventName = 'test-event';
      const data = { foo: 'bar' };

      broadcastService.emit(eventName, data); // No rooms arg

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('no rooms specified'), {
        eventName,
      });
      expect(mockMessageBroker.publish).toHaveBeenCalledWith('websocket', {
        event: eventName,
        data,
      });
    });

    it('should warn and NOT publish if no rooms and no messageBroker', () => {
      broadcastService = new BroadcastService({
        socket: mockSocketManager,
        logger: mockLogger,
        // No messageBroker
      });

      const eventName = 'test-event';
      const data = { foo: 'bar' };

      broadcastService.emit(eventName, data);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
