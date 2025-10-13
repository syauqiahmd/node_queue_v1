const toTicketPrioritizedDTO = (ticket) => ({
  id: ticket.id,
  isPriority: ticket.isPriority,
  serviceId: ticket.serviceId,
});

module.exports = toTicketPrioritizedDTO;
