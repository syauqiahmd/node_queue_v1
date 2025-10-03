const queueService = require('../services/queueService');
const businessException = require('../utils/businessException');
const { successResponse } = require('../utils/response');
const queueResponse = require('../responses/queueResponse');
const googleTextToSpeechService = require('../services/googleTextToSpeechService');

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
    const { action, queueId, counterId: latestAssigneeCounterId } = req.body;
    const data = await queueService.getCurrentQueueDetailById(queueId);
    if (!data) {
      throw businessException.NotFound('queue');
    }
    const updatePayload = {};

    if (!data.isCall) {
      throw businessException.unCalledQueue();
    }

    if (action === 'resolve') {
      updatePayload.isResolved = true;
      const updatedData = await queueService.updateQueueById(queueId, updatePayload);
      return successResponse(res, updatedData);
    }
    if (latestAssigneeCounterId) {
      const updatedData = await queueService.updateQueueById(queueId, {
        latestAssigneeCounterId,
      });
      return successResponse(res, updatedData);
    }

    //TODO: broadcast to all counters by serviceId

    return successResponse(res, data);
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

const getCallingQueue = async (req, res, next) => {
  try {
    const data = await queueService.getCallingQueue();
    return successResponse(res, queueResponse.monitorCurrentQueue(data));
  } catch (err) {
    next(err);
  }
};

const generateQueueCallingSound = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    const data = await queueService.queueDetailById(queueId);

    const callingText = `Nomor antrian: ${data.prefix} - ${data.queueNumber}; silahkan menuju, ke loket nomor, ${data.latestAssigneeCounter.counterNumber}`;
    const soundData = await googleTextToSpeechService.generateSound(callingText);

    return successResponse(res, { data, soundData });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQueueListByServiceId,
  getTotalQueueByServiceId,
  actionQueueById,
  callNextQueue,
  getCallingQueue,
  generateQueueCallingSound,
};
