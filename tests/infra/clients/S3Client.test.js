const mockUpload = jest.fn();
const mockDeleteObject = jest.fn();

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({ upload: mockUpload, deleteObject: mockDeleteObject })),
}));

const S3Client = require('../../../src/infra/clients/S3Client');

// Sets S3_PUBLIC_URL, or removes it when value is undefined.
const setPublicUrl = (value) => {
  if (value === undefined) {
    delete process.env.S3_PUBLIC_URL;
    return;
  }
  process.env.S3_PUBLIC_URL = value;
};

describe('S3Client.uploadFile', () => {
  const originalPublicUrl = process.env.S3_PUBLIC_URL;
  let mockLogger;

  const createClient = (publicUrl) => {
    setPublicUrl(publicUrl);
    return new S3Client({ logger: mockLogger });
  };

  beforeEach(() => {
    mockLogger = { info: jest.fn(), error: jest.fn() };
    mockUpload.mockReset();
    mockUpload.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Location: 'http://storage:8333/bucket/sound-generated/2026-11-05/abc.mp3',
        }),
    });
  });

  afterAll(() => {
    setPublicUrl(originalPublicUrl);
  });

  it('returns the S3 location when S3_PUBLIC_URL is not set', async () => {
    const client = createClient(undefined);

    const url = await client.uploadFile(
      Buffer.from('x'),
      'sound-generated/2026-11-05/abc.mp3',
      'audio/mpeg'
    );

    expect(url).toBe('http://storage:8333/bucket/sound-generated/2026-11-05/abc.mp3');
  });

  it('returns S3_PUBLIC_URL + key when S3_PUBLIC_URL is set', async () => {
    const client = createClient('https://qms.example.go.id/bucket/');

    const url = await client.uploadFile(
      Buffer.from('x'),
      'sound-generated/2026-11-05/abc.mp3',
      'audio/mpeg'
    );

    expect(url).toBe('https://qms.example.go.id/bucket/sound-generated/2026-11-05/abc.mp3');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(url));
  });

  it('treats a blank S3_PUBLIC_URL as unset', async () => {
    const client = createClient('   ');

    const url = await client.uploadFile(Buffer.from('x'), 'a.mp3', 'audio/mpeg');

    expect(url).toBe('http://storage:8333/bucket/sound-generated/2026-11-05/abc.mp3');
  });

  it('encodes unsafe characters in the key', async () => {
    const client = createClient('https://qms.example.go.id/bucket');

    const url = await client.uploadFile(Buffer.from('x'), '/folder/file name.mp3', 'audio/mpeg');

    expect(url).toBe('https://qms.example.go.id/bucket/folder/file%20name.mp3');
  });

  it('rethrows upload errors', async () => {
    const client = createClient('https://qms.example.go.id/bucket');
    mockUpload.mockReturnValue({ promise: () => Promise.reject(new Error('boom')) });

    await expect(client.uploadFile(Buffer.from('x'), 'a.mp3', 'audio/mpeg')).rejects.toThrow(
      'boom'
    );
    expect(mockLogger.error).toHaveBeenCalledWith('Error uploading file to S3: boom');
  });
});

describe('S3Client logo helpers', () => {
  const originalPublicUrl = process.env.S3_PUBLIC_URL;
  const logger = { info: jest.fn(), error: jest.fn() };

  afterEach(() => {
    setPublicUrl(originalPublicUrl);
  });

  it('maps a public URL back to its object key', () => {
    process.env.S3_PUBLIC_URL = 'https://qms.example.com/qms-media/';
    const client = new S3Client({ logger });

    expect(client.keyFromPublicUrl('https://qms.example.com/qms-media/org-logos/a%20b.png')).toBe(
      'org-logos/a b.png'
    );
    expect(client.keyFromPublicUrl('https://elsewhere.example/org-logos/a.png')).toBe(null);
    expect(client.keyFromPublicUrl(null)).toBe(null);
  });

  it('returns null when S3_PUBLIC_URL is not set', () => {
    delete process.env.S3_PUBLIC_URL;
    const client = new S3Client({ logger });

    expect(client.keyFromPublicUrl('https://qms.example.com/qms-media/org-logos/a.png')).toBe(null);
  });

  it('deletes a single object', async () => {
    mockDeleteObject.mockReturnValue({ promise: () => Promise.resolve({}) });
    const client = new S3Client({ logger });

    await client.deleteFile('org-logos/old.png');

    expect(mockDeleteObject).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'org-logos/old.png' })
    );
  });
});
