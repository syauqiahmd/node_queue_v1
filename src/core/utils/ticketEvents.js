// One structured log line per ticket action, for the business panels on the Grafana dashboard
// (query: {service="node-queue-api"} |= "Ticket event" | json). Only ids, service/counter names
// and durations - never visitor data.

const secondsBetween = (from, to) =>
  from && to ? Math.max(0, Math.round((new Date(to) - new Date(from)) / 1000)) : undefined;

function ticketEventMeta(event, ticket, extra = {}) {
  return {
    context: 'TicketEvent',
    event,
    ticketId: ticket.id,
    serviceId: ticket.serviceId,
    serviceName: ticket.service?.name,
    organizationName: ticket.service?.organization?.name,
    counterNumber: ticket.latestAssigneeCounter?.counterNumber,
    isPriority: ticket.isPriority,
    ...extra,
  };
}

/**
 * @param {object} logger
 * @param {'created'|'called'|'recalled'|'resolved'|'prioritized'} event
 * @param {object} ticket - Prisma ticket, ideally with service.organization and latestAssigneeCounter
 * @param {object} [extra] - extra fields, e.g. durations
 */
function logTicketEvent(logger, event, ticket, extra) {
  logger?.info(`Ticket event: ${event}`, ticketEventMeta(event, ticket, extra));
}

module.exports = { logTicketEvent, ticketEventMeta, secondsBetween };
