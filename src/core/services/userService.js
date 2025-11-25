/**
 * @implements {IUserService}
 */
class UserService {
  constructor({ prismaClient }) {
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
        orderBy: { [payload.sortBy]: payload.sortOrder },
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
    if (userData && organization.id && user.role !== 'ADMIN') {
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
    const { organizationId, ...userData } = data;
    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: userData,
      });

      if (updatedUser.role === 'USER') {
        await tx.userOrganization.deleteMany({ where: { userId: id } });
        await tx.userOrganization.create({
          data: {
            userId: id,
            organizationId,
            createdBy: userData.updatedBy || 'System',
            updatedBy: userData.updatedBy || 'System',
          },
        });
      } else {
        await tx.userOrganization.deleteMany({ where: { userId: id } });
      }

      return updatedUser;
    });
  }

  async remove(id) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userOrganization.deleteMany({ where: { userId: id } });
      return tx.user.delete({ where: { id } });
    });
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
