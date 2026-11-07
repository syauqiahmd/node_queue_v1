class AuthController {
  constructor({ userService, redisClient, businessException, authUtils, logger }) {
    this.userService = userService;
    this.redisClient = redisClient;
    this.businessException = businessException;
    this.authUtils = authUtils;
    this.logger = logger;
  }

  // Seconds until the token's `exp`; falls back to 1 hour if the token carries no expiry.
  sessionTtlSeconds(token) {
    const exp = this.authUtils.decodeToken(token)?.exp;
    const remaining = exp ? exp - Math.floor(Date.now() / 1000) : 0;
    return remaining > 0 ? remaining : 60 * 60;
  }

  async login(req, res, next) {
    try {
      const { userName, password } = req.body;
      const data = await this.userService.userDetailByUsername(userName);

      if (!data || !data.isActive) {
        throw this.businessException.Unauthorized('Invalid credentials');
      }
      const isMatch = await this.authUtils.comparePassword(password, data.password);
      if (!isMatch) {
        throw this.businessException.Unauthorized('Invalid credentials');
      }

      const token = this.authUtils.generateToken({ userId: data.id });
      const userDetail = {
        id: data.id,
        userName: data.userName,
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive,
        organization: {
          organizationId: data.assigneeOrganization[0]?.organizationId || '',
          name: data.assigneeOrganization[0]?.organization?.name || '',
          fullName: data.assigneeOrganization[0]?.organization?.fullName || '',
        },
      };

      this.logger.info(`[REDIS] AuthController Redis client status: ${this.redisClient.status()}`, {
        context: 'AuthController',
      });
      // The session lives exactly as long as the JWT (JWT_EXPIRES_IN), so staff are not logged
      // out while their token is still valid. Logout deletes it earlier.
      await this.redisClient.set(
        `auth:token:${token}`,
        JSON.stringify(userDetail),
        'EX',
        this.sessionTtlSeconds(token)
      );

      return res.status(200).json({ success: true, data: { userDetail, token } });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.token;
      if (token) {
        await this.redisClient.del(`auth:token:${token}`);
      }
      return res.status(200).json({ success: true, data: { message: 'logout success' } });
    } catch (err) {
      next(err);
    }
  }

  async validateToken(req, res, next) {
    try {
      const decodedToken = this.authUtils.decodeToken(req.token);
      const data = {
        ...req.user,
        expiresAt: new Date(decodedToken.exp * 1000),
      };
      return res.status(200).json({ success: true, message: 'Token is valid', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
