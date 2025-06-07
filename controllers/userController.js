const userService = require('../services/userService');
const { successResponse } = require('../utils/response');
const businessException = require('../utils/businessException');
const { hashPassword } = require('../utils/auth');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, ...filters } = req.query;
    const data = await userService.getAll({
      ...filters,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await userService.getById(req.params.id);
    if (data === null) {
      throw businessException.NotFound('User');
    }
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { organizationId = '', password, ...rest } = req.body;
    const payload = {
      user: {
        ...rest,
        password: await hashPassword(password), // Ensure password is included in the payload
      },
      organization: {
        id: organizationId,
      },
      createdBy: 'admin', // todo replace wih actual user id
      updatedBy: 'admin', // todo replace wih actual user id
    };
    const data = await userService.create(payload);
    return successResponse(res, data, 'Created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await userService.update(req.params.id, req.body);
    return successResponse(res, data, 'Updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await userService.remove(req.params.id);
    return successResponse(res, data, 'Deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
