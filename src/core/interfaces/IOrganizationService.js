/**
 * @typedef {object} IOrganizationService
 * @property {(payload: object) => Promise<{totalRecord: number, data: object[]}>} getAll
 * @property {(id: string) => Promise<object>} getById
 * @property {(data: object) => Promise<object>} create
 * @property {(id: string, data: object) => Promise<object>} update
 * @property {(id: string) => Promise<void>} remove
 * @property {(payload: object) => Promise<object[]>} getAllWithService
 */

/**
 * @type {IOrganizationService}
 */
const IOrganizationService = {
  getAll: async (payload) => {
    throw new Error('Method not implemented.');
  },
  getById: async (id) => {
    throw new Error('Method not implemented.');
  },
  create: async (data) => {
    throw new Error('Method not implemented.');
  },
  update: async (id, data) => {
    throw new Error('Method not implemented.');
  },
  remove: async (id) => {
    throw new Error('Method not implemented.');
  },
  getAllWithService: async (payload) => {
    throw new Error('Method not implemented.');
  },
};

module.exports = IOrganizationService;
