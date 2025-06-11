const userService = require('../services/userService');
const { successResponse } = require('../utils/response');
const businessException = require('../utils/businessException');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../configs/redisClient');

const login = async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    const data = await userService.userDetailByUsername(userName);

    if (!data || !data.isActive) {
      throw businessException.Unauthorized('Invalid credentials');
    }
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = password === data.password;
    if (!isMatch) {
      throw businessException.Unauthorized('Invalid credentials');
    }

    const token = generateToken({ userId: data.id });
    const userDetail = {
      id: data.id,
      userName: data.userName,
      fullName: data.fullName,
      role: data.role,
      isActive: data.isActive,
      organization: {
        organizationId: data.assigneeOrganization[0].organizationId || '',
        name: data.assigneeOrganization[0]?.organization?.name || '',
        fullName: data.assigneeOrganization[0]?.organization?.FullName || '',
      },
    };

    await redisClient.set(`auth:token:${token}`, JSON.stringify(userDetail), 'EX', 1 * 60 * 60);

    return successResponse(res, { userDetail, token });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.token;
    if (token) {
      await redisClient.del(`auth:token:${token}`);
    }
    return successResponse(req, { message: 'logout success' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
};
