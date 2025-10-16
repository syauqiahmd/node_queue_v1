const toTicketRecalledDTO = (ticket) => {
  if (!ticket) {
    return null;
  }

  return {
    id: ticket.id,
    queueNumber: `${ticket.prefix}-${String(ticket.queueNumber).padStart(3, '0')}`,
    serviceId: ticket.serviceId,
    serviceName: ticket.service.name,
    organizationId: ticket.service.organization.id,
    organizationName: ticket.service.organization.name,
    counterId: ticket.latestAssigneeCounterId,
    counterNumber: ticket.latestAssigneeCounter.counterNumber,
    soundUrl: ticket.soundUrl,
    recalledAt: new Date(),
  };
};

module.exports = toTicketRecalledDTO;
