/**
 * @typedef {object} IVisitorService
 * @property {(payload: object) => Promise<{totalRecord: number, data: object[]}>} getAll
 * @property {(data: object) => Promise<object>} upsertByPhoneNumber
 */

/**
 * @type {IVisitorService}
 */
const IVisitorService = {
  getAll: async (payload) => {
    throw new Error('Method not implemented.');
  },
  upsertByPhoneNumber: async (data) => {
    throw new Error('Method not implemented.');
  },
};

module.exports = IVisitorService;
