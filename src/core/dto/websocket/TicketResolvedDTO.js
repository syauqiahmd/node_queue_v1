const toTicketResolvedDTO = (ticket) => ({
  id: ticket.id,
  isResolved: ticket.isResolved,
  serviceId: ticket.serviceId,
});

module.exports = toTicketResolvedDTO;
