class BroadcastService {
  constructor({ socket, logger, messageBroker }) {
    this.socketManager = socket;
    this.logger = logger;
    this.messageBroker = messageBroker;
  }

  /**
   * Broadcasts an event to one or more Socket.IO rooms.
   * @param {string} eventName - The name of the event to emit.
   * @param {object} data - The payload to send with the event.
   * @param {string[]} rooms - An array of room names to broadcast to.
   */
  emit(eventName, data, rooms = []) {
    const io = this.socketManager.getIO();
    if (!io || !rooms.length) {
      this.logger.warn('Socket.io not initialized or no rooms specified, cannot broadcast.', {
        eventName,
      });
      if (this.messageBroker) {
        this.messageBroker.publish('websocket', { event: eventName, data });
      }
      return;
    }

    try {
      io.to(rooms).emit(eventName, data);
      this.logger.info('Broadcast event sent successfully', { rooms, eventName });
      if (this.messageBroker) {
        this.messageBroker.publish('websocket', { event: eventName, data });
      }
    } catch (err) {
      this.logger.error('Error during broadcasting event', { error: err.message, eventName });
    }
  }
}

module.exports = BroadcastService;
