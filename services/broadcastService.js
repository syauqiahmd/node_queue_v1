const { getIO } = require('../configs/socket');
const logger = require('../utils/logger');

const createTicketEvent = (payload) => {
  const { serviceId, data, type = 'ticket', eventName = 'ticket:created' } = payload;
  const roomName = type === 'ticket' ? `service-${serviceId}` : 'monitor-room';
  try {
    const io = getIO();
    io.to(roomName).emit(eventName, data);
    logger.info('Broadcast event sent successfully', {
      room: roomName,
      event: eventName,
      ticketId: data.id,
    });
  } catch (err) {
    logger.error('Error during broadcasting ticket created event', {
      error: err.message,
      serviceId,
      ticketId: data.id,
    });
  }
};

module.exports = {
  createTicketEvent,
};
