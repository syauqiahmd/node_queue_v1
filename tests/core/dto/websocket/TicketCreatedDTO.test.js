const toTicketCreatedDTO = require('../../../../src/core/dto/websocket/TicketCreatedDTO');

describe('toTicketCreatedDTO', () => {
  it('should map ticket to DTO correctly', () => {
    const ticket = {
      id: 'ticket-1',
      queueNumber: 10,
      prefix: 'B',
      serviceId: 'service-1',
    };

    const result = toTicketCreatedDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      queueNumber: 10,
      prefix: 'B',
      serviceId: 'service-1',
    });
  });
});
