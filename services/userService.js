const prisma = require('../configs/prismaClient');

exports.getAll = async (payload) => {
  const where = {
    userName: payload.userName ? { contains: payload.userName, mode: 'insensitive' } : undefined,
    fullName: payload.fullName ? { contains: payload.fullName, mode: 'insensitive' } : undefined,
    isActive: payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
  };

  const [data, count] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (payload.page - 1) * payload.pageSize,
      take: payload.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { totalRecord: count, data };
};

exports.getById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

exports.create = async (data) => {
  const { user, organization = {}, createdBy = 'System', updatedBy = 'System' } = data;
  const userData = await prisma.user.create({ data: { ...user, createdBy, updatedBy } });
  if (userData && organization.id) {
    await prisma.userOrganization.create({
      data: {
        userId: userData.id,
        organizationId: organization.id,
        createdBy,
        updatedBy,
      },
    });
  }

  return userData;
};

exports.update = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

exports.remove = async (id) => {
  return prisma.user.delete({ where: { id } });
};
