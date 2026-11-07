const { detectImageType } = require('../../../src/infra/utils/imageType');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x10, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
]);

describe('detectImageType', () => {
  it('detects PNG, JPEG and WEBP from their signatures', () => {
    expect(detectImageType(PNG)).toEqual({ ext: 'png', contentType: 'image/png' });
    expect(detectImageType(JPEG)).toEqual({ ext: 'jpg', contentType: 'image/jpeg' });
    expect(detectImageType(WEBP)).toEqual({ ext: 'webp', contentType: 'image/webp' });
  });

  it('rejects SVG, other files, empty buffers and non-buffers', () => {
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe(
      null
    );
    expect(detectImageType(Buffer.from('GIF89a'))).toBe(null);
    expect(detectImageType(Buffer.alloc(0))).toBe(null);
    expect(detectImageType('not a buffer')).toBe(null);
    expect(detectImageType(undefined)).toBe(null);
  });
});
