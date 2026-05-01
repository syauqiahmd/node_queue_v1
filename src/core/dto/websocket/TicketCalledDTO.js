const toTicketCalledDTO = (ticket, caller) => ({
  id: ticket.id,
  queueNumber: `${ticket.prefix}-${ticket.queueNumber}`,
  prefix: ticket.prefix,
  serviceName: ticket.service.name,
  counterNumber: ticket.latestAssigneeCounter.counterNumber,
  calledBy: caller?.fullName || caller?.userName || ticket.latestAssigneeCounter.counterNumber,
  organizationName: ticket.service.organization.name,
  soundUrl: ticket.soundUrl,
});

module.exports = toTicketCalledDTO;
