class ServiceController {
  /**
   * @param {{ serviceService: IServiceService, businessException: any, identityHelper: any }}
   */
  constructor({ serviceService, businessException, identityHelper }) {
    this.serviceService = serviceService;
    this.businessException = businessException;
    this.identityHelper = identityHelper;
  }

  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = req.query;
      const data = await this.serviceService.getAll({
        ...filters,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        sortBy,
        sortOrder,
      });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await this.serviceService.getById(req.params.serviceId);
      if (data === null) {
        throw this.businessException.NotFound('Service');
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
      const data = await this.serviceService.create(payload);
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
      const data = await this.serviceService.update(req.params.serviceId, payload);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await this.serviceService.remove(req.params.serviceId);
      return res.status(200).json({ success: true, data, message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }

  async publicServiceList(req, res, next) {
    try {
      const { totalRecord, data } = await this.serviceService.getAll({ isActive: 'true' }, false);
      const response = data?.map((item) => {
        return {
          id: item.id,
          name: item.name,
          prefix: item.prefix,
          organization: {
            id: item.organization.id,
            name: item.organization.name,
            fullName: item.organization.fullName,
          },
        };
      });
      return res.status(200).json({ success: true, data: { totalRecord, data: response } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ServiceController;
