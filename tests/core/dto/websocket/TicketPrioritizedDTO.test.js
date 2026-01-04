const toTicketPrioritizedDTO = require('../../../../src/core/dto/websocket/TicketPrioritizedDTO');

describe('toTicketPrioritizedDTO', () => {
  it('should map ticket to DTO correctly', () => {
    const ticket = {
      id: 'ticket-1',
      isPriority: true,
      serviceId: 'service-1',
    };

    const result = toTicketPrioritizedDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      isPriority: true,
      serviceId: 'service-1',
    });
  });
});
