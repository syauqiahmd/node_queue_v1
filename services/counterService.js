const prisma = require('../configs/prismaClient');

exports.getAll = async (payload) => {
  const where = {
    counterNumber: payload.counterNumber
      ? { contains: payload.counterNumber, mode: 'insensitive' }
      : undefined,
    isActive: payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
  };

  const [data, count] = await Promise.all([
    prisma.counter.findMany({
      where,
      skip: (payload.page - 1) * payload.pageSize,
      take: payload.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.counter.count({ where }),
  ]);

  return { totalRecord: count, data };
};

exports.getById = async (id) => {
  return prisma.counter.findUnique({ where: { id } });
};

exports.create = async (data) => {
  return prisma.counter.create({ data });
};

exports.update = async (id, data) => {
  return prisma.counter.update({
    where: { id },
    data,
  });
};

exports.remove = async (id) => {
  return prisma.counter.delete({ where: { id } });
};
