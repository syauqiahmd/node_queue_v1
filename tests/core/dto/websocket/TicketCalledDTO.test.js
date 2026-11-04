const toTicketCalledDTO = require('../../../../src/core/dto/websocket/TicketCalledDTO');

const baseTicket = {
  id: 'ticket-1',
  prefix: 'A',
  queueNumber: 123,
  serviceId: 'service-1',
  service: {
    name: 'Service A',
    organization: { name: 'Org A' },
  },
  latestAssigneeCounter: { counterNumber: 5 },
  soundUrl: 'http://example.com/sound.mp3',
};

describe('toTicketCalledDTO', () => {
  it('should map ticket to DTO correctly with no caller — calledBy falls back to counterNumber', () => {
    const result = toTicketCalledDTO(baseTicket);

    expect(result).toEqual({
      id: 'ticket-1',
      queueNumber: 'A-123',
      prefix: 'A',
      serviceId: 'service-1',
      serviceName: 'Service A',
      counterNumber: 5,
      calledBy: 5,
      organizationName: 'Org A',
      soundUrl: 'http://example.com/sound.mp3',
    });
  });

  it('should use caller.fullName as calledBy when provided', () => {
    const caller = { fullName: 'Ahmad Syauqi', userName: 'syauqi' };
    const result = toTicketCalledDTO(baseTicket, caller);

    expect(result.calledBy).toBe('Ahmad Syauqi');
  });

  it('should use caller.userName as calledBy when fullName is absent', () => {
    const caller = { userName: 'syauqi' };
    const result = toTicketCalledDTO(baseTicket, caller);

    expect(result.calledBy).toBe('syauqi');
  });

  it('should fall back to counterNumber when caller is null', () => {
    const result = toTicketCalledDTO(baseTicket, null);

    expect(result.calledBy).toBe(5);
  });

  it('should fall back to counterNumber when caller is undefined', () => {
    const result = toTicketCalledDTO(baseTicket, undefined);

    expect(result.calledBy).toBe(5);
  });

  it('should format queueNumber as prefix-number string', () => {
    const result = toTicketCalledDTO(baseTicket);

    expect(result.queueNumber).toBe('A-123');
  });
});
