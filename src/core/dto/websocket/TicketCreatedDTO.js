const toTicketCreatedDTO = (ticket) => ({
  id: ticket.id,
  queueNumber: ticket.queueNumber,
  prefix: ticket.prefix,
  serviceId: ticket.serviceId,
});

module.exports = toTicketCreatedDTO;
