const toTicketResolvedDTO = require('../../../../src/core/dto/websocket/TicketResolvedDTO');

describe('toTicketResolvedDTO', () => {
  it('should map ticket to DTO correctly', () => {
    const ticket = {
      id: 'ticket-1',
      isResolved: true,
      serviceId: 'service-1',
    };

    const result = toTicketResolvedDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      isResolved: true,
      serviceId: 'service-1',
    });
  });
});
