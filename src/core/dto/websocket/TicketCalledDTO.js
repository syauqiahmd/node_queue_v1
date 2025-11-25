const toTicketCalledDTO = (ticket) => ({
  id: ticket.id,
  queueNumber: `${ticket.prefix}-${ticket.queueNumber}`,
  prefix: ticket.prefix,
  serviceName: ticket.service.name,
  counterNumber: ticket.latestAssigneeCounter.counterNumber,
  organizationName: ticket.service.organization.name,
  soundUrl: ticket.soundUrl,
});

module.exports = toTicketCalledDTO;
