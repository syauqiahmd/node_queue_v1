const PHONE_PATTERN = /^(?:\+62|62|0)(8\d{7,11})$/;

class PhoneNormalizer {
  constructor({ businessException }) {
    this.businessException = businessException;
  }

  normalize(rawPhoneNumber) {
    const trimmed =
      typeof rawPhoneNumber === 'string' ? rawPhoneNumber.trim().replace(/[\s-]/g, '') : '';
    const match = trimmed.match(PHONE_PATTERN);

    if (!match) {
      throw this.businessException.BadRequest('Invalid phone number format');
    }

    return `62${match[1]}`;
  }
}

module.exports = PhoneNormalizer;
