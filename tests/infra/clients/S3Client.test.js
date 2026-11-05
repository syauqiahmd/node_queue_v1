const mockUpload = jest.fn();

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({ upload: mockUpload })),
}));

const S3Client = require('../../../src/infra/clients/S3Client');

describe('S3Client.uploadFile', () => {
  const originalPublicUrl = process.env.S3_PUBLIC_URL;
  let mockLogger;

  const createClient = (publicUrl) => {
    if (publicUrl === undefined) {
      delete process.env.S3_PUBLIC_URL;
    } else {
      process.env.S3_PUBLIC_URL = publicUrl;
    }
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
    if (originalPublicUrl === undefined) {
      delete process.env.S3_PUBLIC_URL;
    } else {
      process.env.S3_PUBLIC_URL = originalPublicUrl;
    }
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
