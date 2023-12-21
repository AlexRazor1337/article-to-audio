import { tts } from "./tts.js";
import fs from 'fs/promises';
import path from 'path';

export const mergeFiles = (ffmpeg, outputFilePath, outputDir) => {
    return new Promise((resolve, reject) => {
        ffmpeg.on('end', () => resolve());
        ffmpeg.on('error', (err) => reject(err));

        ffmpeg.mergeToFile(outputFilePath, outputDir);
    });
};

export const writeAudioFile = async (fileName, mp3Audio) => {
    const speechFile = path.resolve(fileName);
    const buffer = Buffer.from(mp3Audio);

    return fs.writeFile(speechFile, buffer);   
}

export const processChunk = async (chunkContent, fileName, spinner) => {
    spinner.start(`Processing ${fileName}`);

    const mp3Audio = await tts(chunkContent, fileName)
    const result = await writeAudioFile(fileName, mp3Audio);

    spinner.succeed(`Finished processing ${fileName}`);

    return result;
}
