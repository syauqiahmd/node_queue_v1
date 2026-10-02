// Give file transports a moment to flush before the process exits.
const FLUSH_DELAY_MS = 500;
// PM2 sends SIGKILL after its kill_timeout, so cleanup must finish quickly.
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 5000;

const exitAfterFlush = (code) => setTimeout(() => process.exit(code), FLUSH_DELAY_MS);

/**
 * Logs crashes and handles SIGTERM/SIGINT for a process.
 * @param {object} options
 * @param {object} options.logger
 * @param {string} options.name - Process name used in log context.
 * @param {Function} [options.onShutdown] - Async cleanup. Omit to leave signal handling alone.
 */
function registerProcessHandlers({ logger, name, onShutdown }) {
  const context = `Process:${name}`;

  // Keep Node's default behaviour (crash, then PM2 restarts) but make sure it is logged.
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      context,
      error: reason instanceof Error ? reason : new Error(String(reason)),
    });
    exitAfterFlush(1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { context, error });
    exitAfterFlush(1);
  });

  if (!onShutdown) {
    return;
  }

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down`, { context });

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit', { context });
      exitAfterFlush(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await onShutdown();
      logger.info('Shutdown complete', { context });
      exitAfterFlush(0);
    } catch (error) {
      logger.error('Error during shutdown', { context, error });
      exitAfterFlush(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { registerProcessHandlers, exitAfterFlush };
