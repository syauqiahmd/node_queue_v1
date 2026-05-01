class QueueController {
  constructor({ queueService, googleTextToSpeechService, businessException, queueResponse }) {
    this.queueService = queueService;
    this.googleTextToSpeechService = googleTextToSpeechService;
    this.businessException = businessException;
    this.queueResponse = queueResponse;
  }

  async getQueueListByServiceId(req, res, next) {
    try {
      const { serviceId } = req.params;
      const { counterId = null, status = null } = req.query; // Optional query parameter
      const data = await this.queueService.getQueueListByServiceId(serviceId, {
        counterId,
        status,
      });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTotalQueueByServiceId(req, res, next) {
    try {
      const { serviceId } = req.params;
      const { status } = req.query; // Optional query parameter
      const data = await this.queueService.getTotalQueueByServiceId(serviceId, status);
      return res.status(200).json({ success: true, data: { totalRecords: data } });
    } catch (err) {
      next(err);
    }
  }

  async actionQueueById(req, res, next) {
    try {
      const { action, queueId, counterId } = req.body;

      if (action === 'resolve') {
        const updatedTicket = await this.queueService.updateQueueById(queueId, {
          isResolved: true,
        });
        return res
          .status(200)
          .json({ success: true, data: updatedTicket, message: 'Ticket resolved' });
      }

      if (action === 'retry') {
        const recalledTicket = await this.queueService.recallTicket(queueId, counterId, req.user);
        return res
          .status(200)
          .json({ success: true, data: recalledTicket, message: 'Ticket recalled' });
      }

      throw this.businessException.BadRequest('Invalid action specified');
    } catch (err) {
      next(err);
    }
  }

  async callNextQueue(req, res, next) {
    try {
      const { serviceId, counterId } = req.body;
      const data = await this.queueService.callNextQueue({
        serviceId,
        counterId,
        caller: req.user,
      });

      // TODO:
      // add broadcast to all counters by serviceId
      // add broadcast to monitor queue

      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCallingQueue(req, res, next) {
    try {
      const data = await this.queueService.getCallingQueue();
      return res
        .status(200)
        .json({ success: true, data: this.queueResponse.monitorCurrentQueue(data) });
    } catch (err) {
      next(err);
    }
  }

  async generateQueueCallingSound(req, res, next) {
    try {
      const { queueId } = req.params;
      const data = await this.queueService.queueDetailById(queueId);

      if (!data) {
        throw this.businessException.NotFound('Queue');
      }

      if (!data.latestAssigneeCounter) {
        throw this.businessException.BadRequest('Queue has not been assigned to a counter');
      }

      const callingText = `Nomor antrian: ${data.prefix} - ${data.queueNumber}; silahkan menuju, ke loket nomor, ${data.latestAssigneeCounter.counterNumber}`;
      const soundData = await this.googleTextToSpeechService.generateSound(callingText);

      // Save the S3 URL to the ticket record
      await this.queueService.updateQueueById(queueId, { soundUrl: soundData });

      return res
        .status(200)
        .json({ success: true, data: { queueDetail: data, soundUrl: soundData } });
    } catch (err) {
      next(err);
    }
  }

  async prioritizeTicket(req, res, next) {
    try {
      const { queueId } = req.params;
      const updatedTicket = await this.queueService.prioritizeTicket(queueId);
      return res
        .status(200)
        .json({ success: true, data: updatedTicket, message: 'Ticket prioritized' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QueueController;
