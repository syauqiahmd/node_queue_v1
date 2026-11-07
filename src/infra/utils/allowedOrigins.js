// Single source of truth for which browser origins may call the API (CORS for REST and
// Socket.IO, and the origin check on /public writes).
//
// - Origins listed in CORS_ORIGIN (comma-separated) are always allowed.
// - localhost / 127.0.0.1 on any port are allowed only when NODE_ENV=development, so a
//   production server never trusts a page that claims to come from localhost.

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

const configuredOrigins = () =>
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// Exactly http(s)://localhost or 127.0.0.1, optionally with a port; look-alike hosts such as
// localhost.example.com do not match.
const isLocalOrigin = (origin) => {
  if (typeof origin !== 'string') {
    return false;
  }
  try {
    const url = new URL(origin);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      LOCAL_HOSTS.includes(url.hostname) &&
      url.origin === origin
    );
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') {
    return false;
  }
  if (configuredOrigins().includes(origin)) {
    return true;
  }
  return process.env.NODE_ENV === 'development' && isLocalOrigin(origin);
};

// Callback for the `cors` package and Socket.IO. Requests without an Origin header
// (same-origin GETs, curl, server-to-server) are not CORS requests and pass through.
const corsOriginCallback = (origin, callback) => {
  if (!origin || isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('Not allowed by CORS'));
};

module.exports = { isAllowedOrigin, isLocalOrigin, corsOriginCallback };
