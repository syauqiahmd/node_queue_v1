class OrganizationController {
  constructor({ organizationService, businessException }) {
    this.organizationService = organizationService;
    this.businessException = businessException;
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, ...filters } = req.query;
      const data = await this.organizationService.getAll({
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
      const data = await this.organizationService.getById(req.params.organizationId);
      if (data === null) {
        throw this.businessException.NotFound('Organization');
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
        createdBy: 'admin', // todo replace wih actual user id
      };
      const data = await this.organizationService.create(payload);
      return res.status(201).json({ success: true, data, message: 'Created' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await this.organizationService.update(req.params.organizationId, req.body);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await this.organizationService.remove(req.params.organizationId);
      return res.status(200).json({ success: true, data, message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizationController;
