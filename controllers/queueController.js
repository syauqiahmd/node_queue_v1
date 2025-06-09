const queueService = require('../services/queueService');
const { successResponse } = require('../utils/response');

const getQueueListByServiceId = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { counterId = null, status = null } = req.query; // Optional query parameter
    const data = await queueService.getQueueListByServiceId(serviceId, { counterId, status });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const getTotalQueueByServiceId = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.query; // Optional query parameter
    const data = await queueService.getTotalQueueByServiceId(serviceId, status);
    return successResponse(res, { totalRecords: data });
  } catch (err) {
    next(err);
  }
};

const actionQueueById = async (req, res, next) => {
  try {
    return successResponse(res);
  } catch (err) {
    next(err);
  }
};

const callNextQueue = async (req, res, next) => {
  try {
    const { serviceId, counterId } = req.body;
    const data = await queueService.callNextQueue({ serviceId, counterId });

    // TODO:
    // add broadcast to all counters by serviceId
    // add broadcast to monitor queue

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQueueListByServiceId,
  getTotalQueueByServiceId,
  actionQueueById,
  callNextQueue,
};
