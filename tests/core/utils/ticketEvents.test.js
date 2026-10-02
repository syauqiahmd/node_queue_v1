const {
  logTicketEvent,
  ticketEventMeta,
  secondsBetween,
} = require('../../../src/core/utils/ticketEvents');

describe('ticketEvents', () => {
  const ticket = {
    id: 't-1',
    serviceId: 's-1',
    isPriority: false,
    service: { name: 'Customer Service', organization: { name: 'Dukcapil' } },
    latestAssigneeCounter: { counterNumber: 'A1' },
    visitor: { phoneNumber: '6281234567890' },
  };

  it('builds business fields only (no visitor data)', () => {
    expect(ticketEventMeta('called', ticket, { waitSeconds: 90 })).toEqual({
      context: 'TicketEvent',
      event: 'called',
      ticketId: 't-1',
      serviceId: 's-1',
      serviceName: 'Customer Service',
      organizationName: 'Dukcapil',
      counterNumber: 'A1',
      isPriority: false,
      waitSeconds: 90,
    });
  });

  it('tolerates tickets loaded without relations', () => {
    expect(
      ticketEventMeta('prioritized', { id: 't-2', serviceId: 's-2', isPriority: true })
    ).toEqual(
      expect.objectContaining({ ticketId: 't-2', serviceName: undefined, counterNumber: undefined })
    );
  });

  it('logs one info line per event and is a no-op without a logger', () => {
    const logger = { info: jest.fn() };
    logTicketEvent(logger, 'created', ticket, { waitingCount: 3 });
    expect(logger.info).toHaveBeenCalledWith(
      'Ticket event: created',
      expect.objectContaining({ event: 'created', waitingCount: 3 })
    );
    expect(() => logTicketEvent(undefined, 'created', ticket)).not.toThrow();
  });

  it('computes whole-second durations, never negative, undefined when a timestamp is missing', () => {
    expect(secondsBetween('2026-10-03T10:00:00Z', '2026-10-03T10:04:30.400Z')).toBe(270);
    expect(secondsBetween('2026-10-03T10:00:05Z', '2026-10-03T10:00:00Z')).toBe(0);
    expect(secondsBetween(null, '2026-10-03T10:00:00Z')).toBeUndefined();
  });
});
