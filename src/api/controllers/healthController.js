class HealthController {
  constructor({ healthCheck }) {
    this.healthCheck = healthCheck;
  }

  check = async (req, res, next) => {
    try {
      const { healthy, checks } = await this.healthCheck.getStatus();
      return res.status(healthy ? 200 : 503).json({
        success: healthy,
        data: {
          status: healthy ? 'ok' : 'degraded',
          checks,
          uptimeSeconds: Math.round(process.uptime()),
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = HealthController;
