const prisma = require('../configs/prismaClient');

exports.getAll = async (payload) => {
  const where = {
    name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
    prefix: payload.prefix ? { contains: payload.prefix, mode: 'insensitive' } : undefined,
    isActive: payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
  };

  const [data, count] = await Promise.all([
    prisma.service.findMany({
      where,
      skip: (payload.page - 1) * payload.pageSize,
      take: payload.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return { totalRecord: count, data };
};

exports.getById = async (id) => {
  return prisma.service.findUnique({ where: { id } });
};

exports.create = async (data) => {
  return prisma.service.create({ data });
};

exports.update = async (id, data) => {
  return prisma.service.update({
    where: { id },
    data,
  });
};

exports.remove = async (id) => {
  return prisma.service.delete({ where: { id } });
};
