const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

function getTransactionId() {
  const store = asyncLocalStorage.getStore();
  return store ? store.get('transactionId') : undefined;
}

function setUser(user) {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('user', user);
  }
}

function getUser() {
  const store = asyncLocalStorage.getStore();
  return store ? store.get('user') : undefined;
}

module.exports = {
  asyncLocalStorage,
  getTransactionId,
  setUser,
  getUser,
};
