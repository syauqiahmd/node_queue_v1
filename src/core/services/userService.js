const IUserService = require('../interfaces/IUserService');

class UserService extends IUserService {
  constructor({ prismaClient }) {
    super();
    this.prisma = prismaClient;
  }

  async getAll(payload) {
    const where = {
      userName: payload.userName ? { contains: payload.userName, mode: 'insensitive' } : undefined,
      fullName: payload.fullName ? { contains: payload.fullName, mode: 'insensitive' } : undefined,
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };

    const [data, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (payload.page - 1) * payload.pageSize,
        take: payload.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data) {
    const { user, organization = {}, createdBy = 'System', updatedBy = 'System' } = data;
    const userData = await this.prisma.user.create({ data: { ...user, createdBy, updatedBy } });
    if (userData && organization.id) {
      await this.prisma.userOrganization.create({
        data: {
          userId: userData.id,
          organizationId: organization.id,
          createdBy,
          updatedBy,
        },
      });
    }

    return userData;
  }

  async update(id, data) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    return this.prisma.user.delete({ where: { id } });
  }

  async userDetailByUsername(userName) {
    return this.prisma.user.findUnique({
      where: { userName },
      include: {
        assigneeOrganization: {
          include: {
            organization: true,
          },
        },
      },
    });
  }
}

module.exports = UserService;
