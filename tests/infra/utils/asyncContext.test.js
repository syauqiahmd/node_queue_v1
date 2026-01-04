const {
  asyncLocalStorage,
  getTransactionId,
  setUser,
  getUser,
} = require('../../../src/infra/utils/asyncContext');

describe('AsyncContext', () => {
  it('should return undefined if no store', () => {
    expect(getTransactionId()).toBeUndefined();
    expect(getUser()).toBeUndefined();
  });

  it('should set and get user in store', () => {
    const store = new Map();
    asyncLocalStorage.run(store, () => {
      const user = { id: 1, name: 'Test' };
      setUser(user);
      expect(getUser()).toEqual(user);
    });
  });

  it('should get transactionId from store', () => {
    const store = new Map();
    store.set('transactionId', 'tx-123');
    asyncLocalStorage.run(store, () => {
      expect(getTransactionId()).toBe('tx-123');
    });
  });

  it('setUser should do nothing if no store', () => {
    // Should not throw
    setUser({ id: 1 });
  });
});
