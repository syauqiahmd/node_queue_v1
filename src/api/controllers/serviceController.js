class ServiceController {
  /**
   * @param {{ serviceService: IServiceService, businessException: any, identityHelper: any, logger: any }}
   */
  constructor({ serviceService, businessException, identityHelper, logger }) {
    this.serviceService = serviceService;
    this.businessException = businessException;
    this.identityHelper = identityHelper;
    this.logger = logger;
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

      this.logger.info('[ServiceController] Getting all services', { filters, page, pageSize });

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
      this.logger.info(`[ServiceController] Getting service by id: ${req.params.serviceId}`);
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

      this.logger.info('[ServiceController] Creating new service', { payload });

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

      this.logger.info(`[ServiceController] Updating service: ${req.params.serviceId}`, { payload });

      const data = await this.serviceService.update(req.params.serviceId, payload);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      this.logger.info(`[ServiceController] Removing service: ${req.params.serviceId}`);
      const data = await this.serviceService.remove(req.params.serviceId);
      return res.status(200).json({ success: true, data, message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }

  async publicServiceList(req, res, next) {
    try {
      this.logger.info('[ServiceController] Getting public service list');
      const { totalRecord, data } = await this.serviceService.publicGetAll(
        { isActive: 'true' },
        false
      );
      const response = data?.map((item) => {
        return {
          id: item.id,
          name: item.name,
          prefix: item.prefix,
          organization: {
            id: item.organization.id,
            name: item.organization.name,
            fullName: item.organization.fullName,
            logoUrl: item.organization.logoUrl || null,
          },
        };
      });
      return res.status(200).json({ success: true, data: { totalRecord, data: response } });
    } catch (err) {
      next(err);
    }
  }

  async exportDailyServiceStatsReport(req, res, next) {
    try {
      const { serviceId, startDate, endDate } = req.body;
      const endDateFinal = endDate || startDate;
      this.logger.info('[ServiceController] Exporting DailyServiceStats CSV', {
        serviceId,
        startDate,
        endDate: endDateFinal,
      });
      const role = this.identityHelper.getCurrentUserRole();
      const organizationId =
        role === 'USER' ? this.identityHelper.getCurrentUserOrganizationId() : undefined;

      const rows = await this.serviceService.getDailyServiceStats({
        serviceId,
        startDate,
        endDate: endDateFinal,
        organizationId,
      });
      if (!rows || rows.length === 0) {
        throw this.businessException.NotFound('DailyServiceStats');
      }

      const header = [
        'no',
        'tanggal',
        'organisasi',
        'layanan',
        'total_antrian',
        'antrian_selesai',
        'antrian_diproses',
        'rata_rata_waktu_tunggu',
        'waktu_tunggu_minimum',
        'waktu_tunggu_maksimum',
        'median_waktu_tunggu',
        'jam_puncak',
      ].join(',');

      const dataLines = rows
        .map((r, i) =>
          [
            i + 1,
            new Date(r.date).toISOString().split('T')[0],
            r.organization?.name || '',
            r.service?.name || '',
            r.totalTickets,
            r.resolvedTickets,
            r.ticketsInProgress,
            `${Number(r.avgWaitTime).toFixed(2)} menit`,
            `${Number(r.minWaitTime).toFixed(2)} menit`,
            `${Number(r.maxWaitTime).toFixed(2)} menit`,
            `${Number(r.medianWaitTime).toFixed(2)} menit`,
            `${r.peakHour}`,
          ].join(',')
        )
        .join('\n');

      const csv = `${header}\n${dataLines}\n`;
      const filename = `laporan_antrian_${startDate}_${endDateFinal}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ServiceController;
