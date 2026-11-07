class OrganizationController {
  /**
   * @param {{ organizationService: IOrganizationService, businessException: any, identityHelper: any }}
   */
  constructor({ organizationService, businessException, identityHelper }) {
    this.organizationService = organizationService;
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
      const data = await this.organizationService.getAll({
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

  async getPublicList(req, res, next) {
    try {
      const data = await this.organizationService.getAllWithService({
        isActive: 'true',
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
        createdBy: this.identityHelper.getCurrentUserId(),
      };
      const data = await this.organizationService.create(payload);
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
      const data = await this.organizationService.update(req.params.organizationId, payload);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  // multipart/form-data with one image in the `logo` field (parsed by the logoUpload middleware)
  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        throw this.businessException.BadRequest('Logo file is required (form field "logo")');
      }
      const data = await this.organizationService.uploadLogo(
        req.params.organizationId,
        req.file.buffer,
        this.identityHelper.getCurrentUserId()
      );
      return res.status(200).json({ success: true, data, message: 'Logo updated' });
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
