const toTicketCalledDTO = require('../../../../src/core/dto/websocket/TicketCalledDTO');

describe('toTicketCalledDTO', () => {
  it('should map ticket to DTO correctly', () => {
    const ticket = {
      id: 'ticket-1',
      prefix: 'A',
      queueNumber: 123,
      service: {
        name: 'Service A',
        organization: {
          name: 'Org A',
        },
      },
      latestAssigneeCounter: {
        counterNumber: 5,
      },
      soundUrl: 'http://example.com/sound.mp3',
    };

    const result = toTicketCalledDTO(ticket);

    expect(result).toEqual({
      id: 'ticket-1',
      queueNumber: 'A-123',
      prefix: 'A',
      serviceName: 'Service A',
      counterNumber: 5,
      organizationName: 'Org A',
      soundUrl: 'http://example.com/sound.mp3',
    });
  });
});
