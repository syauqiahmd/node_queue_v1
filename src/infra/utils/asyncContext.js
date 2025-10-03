const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

function getTransactionId() {
  const store = asyncLocalStorage.getStore();
  return store ? store.get('transactionId') : undefined;
}

module.exports = {
  asyncLocalStorage,
  getTransactionId,
};
