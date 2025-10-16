const textToSpeech = require('@google-cloud/text-to-speech');

class GoogleTextToSpeechService {
  constructor({ s3Client, logger }) {
    this.client = new textToSpeech.TextToSpeechClient();
    this.s3Client = s3Client;
    this.logger = logger;
  }

  async generateSound(text = '') {
    const request = {
      input: { text },
      voice: { languageCode: 'id-ID', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.75 },
    };

    const [response] = await this.client.synthesizeSpeech(request);

    const audioBuffer = Buffer.from(response.audioContent, 'binary');
    const fileName = `sound-generated/${Date.now()}-${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.mp3`;
    const contentType = 'audio/mpeg';
    const expiresInHours = parseInt(process.env.S3_SOUND_EXPIRATION_HOURS, 10) || 8; // Default to 8 hours
    const expiresInSeconds = expiresInHours * 3600;

    try {
      const s3Url = await this.s3Client.uploadFile(
        audioBuffer,
        fileName,
        contentType,
        expiresInSeconds
      );
      this.logger.info(`Generated sound uploaded to S3: ${s3Url}`);
      return s3Url;
    } catch (error) {
      this.logger.error(`Failed to upload generated sound to S3: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GoogleTextToSpeechService;
