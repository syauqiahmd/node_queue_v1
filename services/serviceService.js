const { prisma } = require('../configs/prismaClient');

exports.getAll = async (payload, pagination = true) => {
  const where = {
    name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
    prefix: payload.prefix ? { contains: payload.prefix, mode: 'insensitive' } : undefined,
    isActive: payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
  };

  let paginationPayload = {};
  if (pagination) {
    paginationPayload = {
      skip: (payload.page - 1) * payload.pageSize || 0,
      take: payload.pageSize || 10,
    };
  }

  const [data, count] = await Promise.all([
    prisma.service.findMany({
      where,
      ...paginationPayload,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
      },
    }),
    prisma.service.count({ where }),
  ]);

  return { totalRecord: count, data };
};

exports.getById = async (id) => {
  return prisma.service.findUnique({
    where: { id },
    include: {
      organization: true,
    },
  });
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
