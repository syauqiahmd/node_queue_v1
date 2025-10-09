class UserController {
  /**
   * @param {{ userService: IUserService, businessException: any, authUtils: any, identityHelper: any }}
   */
  constructor({ userService, businessException, authUtils, identityHelper }) {
    this.userService = userService;
    this.businessException = businessException;
    this.authUtils = authUtils;
    this.identityHelper = identityHelper;
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, ...filters } = req.query;
      const data = await this.userService.getAll({
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
      const data = await this.userService.getById(req.params.userId);
      if (data === null) {
        throw this.businessException.NotFound('User');
      }
      return res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { userName, fullName, password, role, organizationId } = req.body;
      const payload = {
        user: {
          userName,
          fullName,
          // password: await this.authUtils.hashPassword(password), // Ensure password is included in the payload
          password,
          role,
        },
        organization: {
          id: organizationId,
        },
        createdBy: this.identityHelper.getCurrentUserId(),
        updatedBy: this.identityHelper.getCurrentUserId(),
      };
      const data = await this.userService.create(payload);
      return res.status(201).json({ success: true, data, message: 'Created' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { password, ...rest } = req.body;
      const payload = { ...rest, updatedBy: this.identityHelper.getCurrentUserId() };

      if (password) {
        // payload.password = await this.authUtils.hashPassword(password);
      }

      const data = await this.userService.update(req.params.userId, payload);
      return res.status(200).json({ success: true, data, message: 'Updated' });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await this.userService.remove(req.params.userId);
      return res.status(200).json({ success: true, data, message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
