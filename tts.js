import OpenAI from 'openai';

import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const TTS_MODEL = process.env.TTS_MODEL || 'tts-1';
const TTS_VOICE = process.env.TTS_VOICE || 'echo';

export const tts = async (input) => {
    const mp3 = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input,
    });

    return mp3.arrayBuffer()
}
