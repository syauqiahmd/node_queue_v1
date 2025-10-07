class AsyncContextRunnerMiddleware {
  constructor({ asyncContext }) {
    this.asyncLocalStorage = asyncContext.asyncLocalStorage;
  }

  run = (req, res, next) => {
    const store = new Map();
    this.asyncLocalStorage.run(store, () => {
      next();
    });
  };
}

module.exports = AsyncContextRunnerMiddleware;
