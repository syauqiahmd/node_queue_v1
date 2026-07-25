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

  async exportReport(req, res, next) {
    try {
      const { startDate, endDate, organizationId: orgFromBody, ...filters } = req.body;
      const endDateFinal = endDate || startDate;

      const role = this.identityHelper.getCurrentUserRole();
      const organizationId =
        role === 'USER' ? this.identityHelper.getCurrentUserOrganizationId() : orgFromBody;

      if (role === 'USER' && orgFromBody && orgFromBody !== organizationId) {
        throw this.businessException.Forbidden('Insufficient permissions');
      }

      const rows = await this.visitorHistoryService.getReport({
        ...filters,
        organizationId,
        startDate,
        endDate: endDateFinal,
      });
      if (!rows || rows.length === 0) {
        throw this.businessException.NotFound('VisitorHistory');
      }

      const header = [
        'no',
        'nama_pengunjung',
        'nomor_hp',
        'email',
        'organisasi',
        'tanggal_kunjungan',
        'tanggal_tercatat',
      ].join(',');

      const dataLines = rows
        .map((r, i) =>
          [
            i + 1,
            r.visitor?.name || '',
            r.visitor?.phoneNumber || '',
            r.visitor?.email || '',
            r.organization?.name || '',
            new Date(r.visitDate).toISOString().split('T')[0],
            new Date(r.createdAt).toISOString().split('T')[0],
          ].join(',')
        )
        .join('\n');

      const csv = `${header}\n${dataLines}\n`;
      const filename = `laporan_riwayat_kunjungan_${startDate}_${endDateFinal}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VisitorHistoryController;
