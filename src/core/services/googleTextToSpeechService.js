const textToSpeech = require('@google-cloud/text-to-speech');
const { writeFile } = require('node:fs/promises');

class GoogleTextToSpeechService {
  constructor() {
    // The client will automatically use the credentials from the GOOGLE_APPLICATION_CREDENTIALS environment variable
    this.client = new textToSpeech.TextToSpeechClient();
  }

  async generateSound(text = '') {
    const request = {
      input: { text },
      voice: { languageCode: 'id-ID', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.75 },
    };

    const [response] = await this.client.synthesizeSpeech(request);

    // In a real application, you might want to store this in a more robust way
    // or stream it directly to the client. For now, keeping the file write.
    await writeFile('output.mp3', response.audioContent, 'binary');

    const base64Audio = response.audioContent.toString('base64');

    return base64Audio;
  }
}

module.exports = GoogleTextToSpeechService;
