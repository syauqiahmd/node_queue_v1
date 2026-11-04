const toTicketPrioritizedDTO = (ticket) => ({
  id: ticket.id,
  queueNumber: ticket.queueNumber,
  prefix: ticket.prefix,
  isPriority: ticket.isPriority,
  serviceId: ticket.serviceId,
});

module.exports = toTicketPrioritizedDTO;
