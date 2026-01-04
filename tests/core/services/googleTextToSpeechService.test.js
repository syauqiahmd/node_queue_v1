const GoogleTextToSpeechService = require('../../../src/core/services/googleTextToSpeechService');

// Mock @google-cloud/text-to-speech
const mockSynthesizeSpeech = jest.fn();
jest.mock('@google-cloud/text-to-speech', () => {
  return {
    TextToSpeechClient: jest.fn().mockImplementation(() => {
      return {
        synthesizeSpeech: mockSynthesizeSpeech,
      };
    }),
  };
});

describe('GoogleTextToSpeechService', () => {
  let googleTextToSpeechService;
  let mockS3Client;
  let mockLogger;

  beforeEach(() => {
    mockS3Client = {
      uploadFile: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    googleTextToSpeechService = new GoogleTextToSpeechService({
      s3Client: mockS3Client,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSound', () => {
    it('should generate sound and upload to S3', async () => {
      const text = 'Queue number A 1';
      const queueId = 'ticket-1';
      const mockAudioContent = 'audio-content';
      const mockS3Url = 'https://s3.url/sound.mp3';

      mockSynthesizeSpeech.mockResolvedValue([{ audioContent: mockAudioContent }]);
      mockS3Client.uploadFile.mockResolvedValue(mockS3Url);

      const result = await googleTextToSpeechService.generateSound(text, queueId);

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { text },
          voice: { languageCode: 'id-ID', ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.75 },
        })
      );

      expect(mockS3Client.uploadFile).toHaveBeenCalledWith(
        Buffer.from(mockAudioContent, 'binary'),
        expect.stringContaining('sound-generated/'),
        'audio/mpeg',
        expect.any(Number)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(mockS3Url));
      expect(result).toBe(mockS3Url);
    });

    it('should handle errors during generation or upload', async () => {
      const text = 'Queue number A 1';
      const queueId = 'ticket-1';
      const error = new Error('Upload failed');

      mockSynthesizeSpeech.mockResolvedValue([{ audioContent: 'audio' }]);
      mockS3Client.uploadFile.mockRejectedValue(error);

      await expect(googleTextToSpeechService.generateSound(text, queueId)).rejects.toThrow(error);

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(error.message));
    });

    it('should use default text if not provided', async () => {
      const queueId = 'ticket-1';
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent: 'audio-content' }]);
      mockS3Client.uploadFile.mockResolvedValue('url');

      await googleTextToSpeechService.generateSound(undefined, queueId);

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { text: '' },
        })
      );
    });
  });
});
