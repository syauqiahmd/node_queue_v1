class CounterController {
  /**
   * @param {{ counterService: ICounterService, businessException: any, identityHelper: any }}
   */
  constructor({ counterService, businessException, identityHelper }) {
    this.counterService = counterService;
    this.businessException = businessException;
    this.identityHelper = identityHelper;
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, ...filters } = req.query;
      const data = await this.counterService.getAll({
        ...filters,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
      });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await this.counterService.getById(req.params.counterId);
      if (data === null) {
        throw this.businessException.NotFound('Counter');
      }
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        createdBy: this.identityHelper.getCurrentUserId(),
      };
      const data = await this.counterService.create(payload);
      return res.status(201).json({ success: true, data, message: 'Created' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const payload = {
        ...req.body,
        updatedBy: this.identityHelper.getCurrentUserId(),
      };
      const data = await this.counterService.update(req.params.counterId, payload);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await this.counterService.remove(req.params.counterId);
      return res.status(200).json({ success: true, data, message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CounterController;
