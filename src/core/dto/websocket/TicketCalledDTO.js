const toTicketCalledDTO = (ticket) => ({
  id: ticket.id,
  queueNumber: ticket.queueNumber,
  prefix: ticket.prefix,
  serviceName: ticket.service.name,
  counterNumber: ticket.latestAssigneeCounter.counterNumber,
  organizationName: ticket.service.organization.name,
});

module.exports = toTicketCalledDTO;
