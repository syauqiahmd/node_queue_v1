const toTicketRecalledDTO = require('../../../../src/core/dto/websocket/TicketRecalledDTO');

describe('toTicketRecalledDTO', () => {
  it('should return null if ticket is null', () => {
    const result = toTicketRecalledDTO(null);
    expect(result).toBeNull();
  });

  it('should return dto object if ticket is provided', () => {
    const ticket = {
      id: 'ticket-1',
      prefix: 'A',
      queueNumber: 1,
      serviceId: 'service-1',
      service: {
        name: 'Service 1',
        organization: {
          id: 'org-1',
          name: 'Org 1',
        },
      },
      latestAssigneeCounterId: 'counter-1',
      latestAssigneeCounter: {
        counterNumber: 1,
      },
      soundUrl: 'http://sound.url',
    };

    const result = toTicketRecalledDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      queueNumber: 'A-001',
      serviceId: 'service-1',
      serviceName: 'Service 1',
      organizationId: 'org-1',
      organizationName: 'Org 1',
      counterId: 'counter-1',
      counterNumber: 1,
      soundUrl: 'http://sound.url',
      recalledAt: expect.any(Date),
    });
  });
});
