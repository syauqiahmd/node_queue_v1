/**
 * @implements {IOrganizationService}
 */
const { detectImageType } = require('../../infra/utils/imageType');

const LOGO_PREFIX = 'org-logos/';

class OrganizationService {
  constructor({ prismaClient, s3Client, businessException, logger }) {
    this.prisma = prismaClient;
    this.s3Client = s3Client;
    this.businessException = businessException;
    this.logger = logger;
  }

  // Stores a new logo in S3 under org-logos/ (served by nginx at /qms-media/org-logos/) and
  // points the organization at it. The previous logo file is removed when it was one of ours
  // and no other organization still uses it.
  async uploadLogo(id, buffer, updatedBy) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      throw this.businessException.NotFound('Organization');
    }

    const imageType = detectImageType(buffer);
    if (!imageType) {
      throw this.businessException.BadRequest('Logo must be a PNG, JPEG or WEBP image');
    }

    const key = `${LOGO_PREFIX}${id}-${Date.now()}.${imageType.ext}`;
    const logoUrl = await this.s3Client.uploadFile(buffer, key, imageType.contentType);
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { logoUrl, updatedBy },
    });

    await this.removeUnusedLogo(organization.logoUrl, id);
    return updated;
  }

  // Best effort: a failed delete only leaves an orphaned file behind.
  async removeUnusedLogo(logoUrl, organizationId) {
    const key = this.s3Client.keyFromPublicUrl(logoUrl);
    if (!key || !key.startsWith(LOGO_PREFIX)) {
      return;
    }
    try {
      const stillUsed = await this.prisma.organization.count({
        where: { logoUrl, NOT: { id: organizationId } },
      });
      if (stillUsed === 0) {
        await this.s3Client.deleteFile(key);
      }
    } catch (error) {
      this.logger?.warn(`Could not delete previous logo ${key}: ${error.message}`);
    }
  }

  async getAll(payload) {
    const where = {
      name: payload.name ? { contains: payload.name, mode: 'insensitive' } : undefined,
      fullName: payload.fullName ? { contains: payload.fullName, mode: 'insensitive' } : undefined,
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };

    const pagination = {};
    if (payload.pagination !== 'false') {
      pagination.skip = (payload.page - 1) * payload.pageSize;
      pagination.take = payload.pageSize;
    }

    const [data, count] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        ...pagination,
        orderBy: { [payload.sortBy]: payload.sortOrder },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { totalRecord: count, data };
  }

  async getById(id) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async create(data) {
    return this.prisma.organization.create({ data });
  }

  async update(id, data) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async remove(id) {
    return this.prisma.organization.delete({ where: { id } });
  }

  async getAllWithService(payload) {
    const { OrganizationResponse } = require('../dto/organizationResponse');
    const where = {
      isActive:
        payload.isActive === 'true' ? true : payload.isActive === 'false' ? false : undefined,
    };
    const organizations = await this.prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        logoUrl: true,
        services: {
          where,
          select: {
            id: true,
            name: true,
            prefix: true,
          },
        },
      },
      orderBy: { name: 'desc' },
    });

    return organizations.map((organization) => new OrganizationResponse(organization));
  }
}

module.exports = OrganizationService;
