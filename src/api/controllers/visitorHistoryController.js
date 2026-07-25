class VisitorHistoryController {
  /**
   * @param {{ visitorHistoryService: any, identityHelper: any, businessException: any }}
   */
  constructor({ visitorHistoryService, identityHelper, businessException }) {
    this.visitorHistoryService = visitorHistoryService;
    this.identityHelper = identityHelper;
    this.businessException = businessException;
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

      // USER role is confined to history under their own organization; ADMIN can filter freely.
      if (this.identityHelper.getCurrentUserRole() === 'USER') {
        const organizationId = this.identityHelper.getCurrentUserOrganizationId();
        if (!organizationId) {
          throw this.businessException.Forbidden('User is not assigned to an organization');
        }
        filters.organizationId = organizationId;
      }

      const data = await this.visitorHistoryService.getAll({
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

  async create(req, res, next) {
    try {
      const data = await this.visitorHistoryService.create(req.body);
      return res.status(201).json({ success: true, data, message: 'Created' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VisitorHistoryController;
