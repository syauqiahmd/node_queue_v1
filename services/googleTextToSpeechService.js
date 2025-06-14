// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const { writeFile } = require('node:fs/promises');

// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials.json';
const credentials = require('./credentials.json');
// Creates a client
const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
  projectId: credentials.project_id, // Optional, but good practice to include
});

const generateSound = async (text = '') => {
  // The text to synthesize

  // Construct the request
  const request = {
    input: { text },
    // Select the language and SSML voice gender (optional)
    voice: { languageCode: 'id-ID', ssmlGender: 'NEUTRAL' },
    // select the type of audio encoding and set speaking rate
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.75 },
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);

  // Write the binary audio content to disk
  await writeFile('output.mp3', response.audioContent, 'binary');

  // Convert the audio content to base64
  const base64Audio = response.audioContent.toString('base64');

  return base64Audio;
};

module.exports = {
  generateSound,
};
