const { prisma } = require('../configs/prismaClient');

exports.getAll = async (payload) => {
  const where = {
    name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
    fullName: payload.fullName ? { contains: payload.fullName, mode: 'insensitive' } : undefined,
    isActive: payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
  };

  const [data, count] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: (payload.page - 1) * payload.pageSize,
      take: payload.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organization.count({ where }),
  ]);

  return { totalRecord: count, data };
};

exports.getById = async (id) => {
  return prisma.organization.findUnique({ where: { id } });
};

exports.create = async (data) => {
  return prisma.organization.create({ data });
};

exports.update = async (id, data) => {
  return prisma.organization.update({
    where: { id },
    data,
  });
};

exports.remove = async (id) => {
  return prisma.organization.delete({ where: { id } });
};
