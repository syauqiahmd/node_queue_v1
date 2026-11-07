const multer = require('multer');

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

// Parses a multipart/form-data upload with a single image in the `logo` field into
// req.file.buffer (kept in memory; never written to disk). The image type itself is checked
// from the file contents by the organization service.
class LogoUploadMiddleware {
  constructor({ businessException }) {
    this.businessException = businessException;
    this.parser = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: MAX_LOGO_BYTES, files: 1, fields: 0 },
    }).single('logo');
  }

  single = (req, res, next) => {
    this.parser(req, res, (err) => {
      if (!err) {
        return next();
      }
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Logo must be 1 MB or smaller'
            : `Invalid logo upload: ${err.message}`;
        return next(this.businessException.BadRequest(message));
      }
      return next(err);
    });
  };
}

LogoUploadMiddleware.MAX_LOGO_BYTES = MAX_LOGO_BYTES;

module.exports = LogoUploadMiddleware;
