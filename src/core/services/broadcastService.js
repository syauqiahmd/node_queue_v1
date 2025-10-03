class BroadcastService {
  constructor({ socket, logger }) {
    this.socketManager = socket;
    this.logger = logger;
  }

  createTicketEvent(payload, type = 'ticket') {
    const { serviceId, data, eventName = 'ticket:created' } = payload;
    const roomName = type === 'ticket' ? `service-${serviceId}` : 'monitor-room';
    const io = this.socketManager.getIO();

    if (!io) {
      this.logger.warn('Socket.io not initialized, cannot broadcast event', {
        room: roomName,
        event: eventName,
        ticketId: data.id,
      });
      return;
    }

    try {
      io.to(roomName).emit(eventName, data);
      this.logger.info('Broadcast event sent successfully', {
        room: roomName,
        event: eventName,
        ticketId: data.id,
      });
    } catch (err) {
      this.logger.error('Error during broadcasting ticket created event', {
        error: err.message,
        serviceId,
        ticketId: data.id,
      });
    }
  }
}

module.exports = BroadcastService;
