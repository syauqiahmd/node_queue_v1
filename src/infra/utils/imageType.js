// Detects an image format from its first bytes ("magic numbers"). The file name and the
// Content-Type sent by the browser are not trusted. SVG is deliberately not supported: it can
// carry scripts, and logos are served from the app's own origin.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const IMAGE_TYPES = [
  {
    ext: 'png',
    contentType: 'image/png',
    matches: (buf) => buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE),
  },
  {
    ext: 'jpg',
    contentType: 'image/jpeg',
    matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    ext: 'webp',
    contentType: 'image/webp',
    matches: (buf) =>
      buf.length >= 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP',
  },
];

// Returns { ext, contentType } or null when the buffer is not a supported image.
const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }
  const type = IMAGE_TYPES.find(({ matches }) => matches(buffer));
  return type ? { ext: type.ext, contentType: type.contentType } : null;
};

module.exports = { detectImageType };
