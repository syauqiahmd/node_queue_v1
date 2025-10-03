const textToSpeech = require('@google-cloud/text-to-speech');
const { writeFile } = require('node:fs/promises');

class GoogleTextToSpeechService {
  constructor() {
    // Assuming credentials.json is loaded elsewhere or passed as config
    // For now, I'll keep the direct require for simplicity, but ideally this would be injected
    const credentials = require('../../infra/configs/credentials.json'); // Path changed

    this.client = new textToSpeech.TextToSpeechClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
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
