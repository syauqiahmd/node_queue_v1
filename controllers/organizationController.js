const organizationService = require('../services/organizationService');
const { successResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, ...filters } = req.query;
    const data = await organizationService.getAll({
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
    const data = await organizationService.getById(req.params.id);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      createdBy: 'admin', // todo replace wih actual user id
    };
    const data = await organizationService.create(payload);
    return successResponse(res, data, 'Created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await organizationService.update(req.params.id, req.body);
    return successResponse(res, data, 'Updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await organizationService.remove(req.params.id);
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
