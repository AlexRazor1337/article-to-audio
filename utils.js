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

const processChunk = async (chunkContent, fileName, spinner) => {
    spinner.start(`Processing ${fileName}`);

    const mp3Audio = await tts(chunkContent, fileName)
    await writeAudioFile(fileName, mp3Audio);

    spinner.succeed(`Finished processing ${fileName}`);

    return fileName;
}

export const processChunkWithRetry = async (chunkContent, fileName, spinner, retries = 3) => {
    try {
        return await processChunk(chunkContent, fileName, spinner);
    } catch (err) {
        if (retries === 0) throw err;
        console.error(err);
        spinner.fail(`Failed processing ${fileName}, retrying`);
        return await processChunkWithRetry(chunkContent, fileName, spinner, retries - 1);
    }
}
