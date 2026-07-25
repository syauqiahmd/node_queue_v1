class VisitorController {
  /**
   * @param {{ visitorService: IVisitorService, businessException: any }}
   */
  constructor({ visitorService, businessException }) {
    this.visitorService = visitorService;
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

  async exportReport(req, res, next) {
    try {
      const { startDate, endDate, ...filters } = req.body;
      const endDateFinal = endDate || startDate;

      const rows = await this.visitorService.getReport({
        ...filters,
        startDate,
        endDate: endDateFinal,
      });
      if (!rows || rows.length === 0) {
        throw this.businessException.NotFound('Visitor');
      }

      const header = ['no', 'nama', 'nomor_hp', 'email', 'tanggal_daftar'].join(',');

      const dataLines = rows
        .map((r, i) =>
          [
            i + 1,
            r.name,
            r.phoneNumber,
            r.email || '',
            new Date(r.createdAt).toISOString().split('T')[0],
          ].join(',')
        )
        .join('\n');

      const csv = `${header}\n${dataLines}\n`;
      const filename = `laporan_pengunjung_${startDate}_${endDateFinal}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VisitorController;
