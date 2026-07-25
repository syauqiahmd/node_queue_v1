class VisitorController {
  /**
   * @param {{ visitorService: IVisitorService }}
   */
  constructor({ visitorService }) {
    this.visitorService = visitorService;
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
      const data = await this.visitorService.getAll({
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

  async upsert(req, res, next) {
    try {
      const data = await this.visitorService.upsertByPhoneNumber(req.body);
      return res.status(200).json({ success: true, data, message: 'Success' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VisitorController;
