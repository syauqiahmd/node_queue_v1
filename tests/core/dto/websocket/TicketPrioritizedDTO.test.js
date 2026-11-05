const toTicketPrioritizedDTO = require('../../../../src/core/dto/websocket/TicketPrioritizedDTO');

describe('toTicketPrioritizedDTO', () => {
  it('should map ticket to DTO correctly', () => {
    const ticket = {
      id: 'ticket-1',
      prefix: 'A',
      queueNumber: 7,
      isPriority: true,
      serviceId: 'service-1',
    };

    const result = toTicketPrioritizedDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      queueNumber: 7,
      prefix: 'A',
      isPriority: true,
      serviceId: 'service-1',
    });
  });
});
