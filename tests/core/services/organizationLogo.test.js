const OrganizationService = require('../../../src/core/services/organizationService');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const BASE = 'https://qms.example.com/qms-media';

describe('OrganizationService.uploadLogo', () => {
  let service;
  let mockPrisma;
  let mockS3;
  let mockLogger;
  const businessException = {
    NotFound: jest.fn((item) => new Error(`${item} not found`)),
    BadRequest: jest.fn((msg) => new Error(msg)),
  };

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    mockPrisma = {
      organization: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    mockS3 = {
      uploadFile: jest.fn((buffer, key) => Promise.resolve(`${BASE}/${key}`)),
      keyFromPublicUrl: jest.fn((url) =>
        typeof url === 'string' && url.startsWith(`${BASE}/`) ? url.slice(BASE.length + 1) : null
      ),
      deleteFile: jest.fn().mockResolvedValue(),
    };
    mockLogger = { warn: jest.fn() };
    service = new OrganizationService({
      prismaClient: mockPrisma,
      s3Client: mockS3,
      businessException,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('uploads the image under org-logos/ and stores its public URL', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1', logoUrl: null });
    mockPrisma.organization.update.mockResolvedValue({ id: 'org-1', logoUrl: 'new' });

    const result = await service.uploadLogo('org-1', PNG, 'user-1');

    expect(mockS3.uploadFile).toHaveBeenCalledWith(
      PNG,
      'org-logos/org-1-1700000000000.png',
      'image/png'
    );
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { logoUrl: `${BASE}/org-logos/org-1-1700000000000.png`, updatedBy: 'user-1' },
    });
    expect(result).toEqual({ id: 'org-1', logoUrl: 'new' });
    expect(mockS3.deleteFile).not.toHaveBeenCalled();
  });

  it('throws NotFound for an unknown organization without uploading', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.uploadLogo('missing', PNG, 'user-1')).rejects.toThrow(
      'Organization not found'
    );
    expect(mockS3.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects files that are not PNG, JPEG or WEBP', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });

    await expect(service.uploadLogo('org-1', Buffer.from('<svg/>'), 'user-1')).rejects.toThrow(
      'Logo must be a PNG, JPEG or WEBP image'
    );
    expect(mockS3.uploadFile).not.toHaveBeenCalled();
  });

  it('deletes the previous logo when it is ours and unused elsewhere', async () => {
    const oldUrl = `${BASE}/org-logos/old.png`;
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1', logoUrl: oldUrl });
    mockPrisma.organization.update.mockResolvedValue({ id: 'org-1' });

    await service.uploadLogo('org-1', PNG, 'user-1');

    expect(mockPrisma.organization.count).toHaveBeenCalledWith({
      where: { logoUrl: oldUrl, NOT: { id: 'org-1' } },
    });
    expect(mockS3.deleteFile).toHaveBeenCalledWith('org-logos/old.png');
  });

  it('keeps the previous logo when another organization still uses it', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      logoUrl: `${BASE}/org-logos/shared.png`,
    });
    mockPrisma.organization.count.mockResolvedValue(1);

    await service.uploadLogo('org-1', PNG, 'user-1');

    expect(mockS3.deleteFile).not.toHaveBeenCalled();
  });

  it('never deletes external logos or files outside org-logos/', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      logoUrl: 'https://other-site.example/logo.png',
    });
    await service.uploadLogo('org-1', PNG, 'user-1');

    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      logoUrl: `${BASE}/sound-generated/a.mp3`,
    });
    await service.uploadLogo('org-1', PNG, 'user-1');

    expect(mockS3.deleteFile).not.toHaveBeenCalled();
  });

  it('still succeeds when deleting the previous logo fails', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      logoUrl: `${BASE}/org-logos/old.png`,
    });
    mockPrisma.organization.update.mockResolvedValue({ id: 'org-1' });
    mockS3.deleteFile.mockRejectedValue(new Error('S3 down'));

    await expect(service.uploadLogo('org-1', PNG, 'user-1')).resolves.toEqual({ id: 'org-1' });
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
