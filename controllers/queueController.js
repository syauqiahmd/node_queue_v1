const queueService = require('../services/queueService');
const { successResponse } = require('../utils/response');
// const businessException = require('../utils/businessException');

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

module.exports = {
  getQueueListByServiceId,
  getTotalQueueByServiceId,
};
