const { redact, maskPhone, maskEmail } = require('../../../src/infra/utils/redact');

describe('redact', () => {
  describe('phone numbers in free text', () => {
    it.each([
      ['local format', 'call 081234567890 now', 'call 0812*****890 now'],
      ['normalized format', 'visitor 6281234567890', 'visitor 6281******890'],
      ['international format', '(+6281234567890)', '(+628*******890)'],
      [
        'Prisma invocation message',
        'data: { phoneNumber: "6281234567890" }',
        'data: { phoneNumber: "6281******890" }',
      ],
    ])('masks %s', (_, input, expected) => {
      expect(redact(input)).toBe(expected);
    });

    it.each([
      ['UUID with a digit-only block', '3f1c2a4b-0812-4abc-9def-081234567890'],
      ['ticket code', 'ticket A0812345678'],
      ['millisecond timestamp', 'at 1727890000123'],
      ['number too long to be a phone', '62812345678901234'],
    ])('leaves %s untouched', (_, input) => {
      expect(redact(input)).toBe(input);
    });
  });

  it('masks emails in free text', () => {
    expect(redact('sent to john.doe@gmail.com')).toBe('sent to j***@gmail.com');
  });

  it('redacts JWTs and bearer tokens in free text', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.abc_DEF-123';
    expect(redact(`token ${jwt}`)).toBe('token [REDACTED]');
    expect(redact('Bearer abc.def-ghi')).toBe('Bearer [REDACTED]');
  });

  it('redacts credential fields regardless of key casing or separators', () => {
    expect(
      redact({
        password: 'hunter2',
        access_token: 'abc',
        'X-Service-Key': 'key',
        headers: { Authorization: 'Bearer abc' },
      })
    ).toEqual({
      password: '[REDACTED]',
      access_token: '[REDACTED]',
      'X-Service-Key': '[REDACTED]',
      headers: { Authorization: '[REDACTED]' },
    });
  });

  it('keeps empty credential fields as-is so "missing" stays distinguishable', () => {
    expect(redact({ password: '', token: null })).toEqual({ password: '', token: null });
  });

  it('masks phone and email fields in any format, including nested in arrays', () => {
    expect(
      redact({
        visitors: [{ phoneNumber: '0812-3456-7890', email: 'jane@example.com', name: 'Budi' }],
        phone_number: 6281234567890,
      })
    ).toEqual({
      visitors: [{ phoneNumber: '0812*******890', email: 'j***@example.com', name: 'Budi' }],
      phone_number: '6281******890',
    });
  });

  it('keeps transactionId intact', () => {
    expect(redact({ transactionId: 'caller-081234567890' })).toEqual({
      transactionId: 'caller-081234567890',
    });
  });

  it('does not mutate the input', () => {
    const input = { visitor: { phoneNumber: '6281234567890' } };
    redact(input);
    expect(input.visitor.phoneNumber).toBe('6281234567890');
  });

  it('handles circular references, dates and deep nesting', () => {
    const circular = { a: 1 };
    circular.self = circular;
    const date = new Date('2026-01-01T00:00:00Z');
    let deep = { phone: '6281234567890' };
    for (let i = 0; i < 10; i++) {
      deep = { next: deep };
    }

    expect(redact(circular)).toEqual({ a: 1, self: '[Circular]' });
    expect(redact({ date }).date).toBe(date);
    expect(JSON.stringify(redact(deep))).toContain('[Truncated]');
    expect(JSON.stringify(redact(deep))).not.toContain('6281234567890');
  });

  it('passes non-string primitives through', () => {
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
    expect(redact(true)).toBe(true);
  });
});

describe('maskPhone / maskEmail', () => {
  it('masks short values entirely', () => {
    expect(maskPhone('12345')).toBe('***');
    expect(maskEmail('not-an-email')).toBe('***');
  });
});

describe('email pattern performance', () => {
  it('stays fast on long text without an @ (no catastrophic backtracking)', () => {
    const input = 'a'.repeat(50000);
    const start = Date.now();
    expect(redact(input)).toBe(input);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('still masks emails with subdomains and plus tags', () => {
    expect(redact('mail john.doe+x@mail.example.co.id today')).not.toContain('john.doe+x@');
  });
});
