import path from "path";
import fs from "fs/promises";

import ora from "ora";
import OpenAI from "openai";
import dotenv from "dotenv";
import { chunk } from 'llm-chunk';
import fluentFFmpeg from "fluent-ffmpeg";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MAX_PARALLEL = process.env.MAX_PARALLEL || 5;
const MAX_CHUNK_SIZE = process.env.MAX_CHUNK_SIZE || 3000;

const mergeFiles = (ffmpeg, outputFilePath, outputDir) => {
    return new Promise((resolve, reject) => {
        ffmpeg.on('end', () => resolve());
        ffmpeg.on('error', (err) => reject(err));

        ffmpeg.mergeToFile(outputFilePath, outputDir);
    });
};

const tts = async (input, fileName) => {
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "echo",
        input,
    });
    
    const speechFile = path.resolve(fileName);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    return fs.writeFile(speechFile, buffer);
}

const processChunk = async (chunkContent, fileName, spinner) => {
    spinner.start(`Processing ${fileName}`);
    
    const result = await tts(chunkContent, fileName)
    
    spinner.succeed(`Finished processing ${fileName}`);
    
    return result;
}

const main = async () => {
    
    const inputText = await fs.readFile("./input.txt", "utf-8");
    const chunks = chunk(inputText, {
        minLength: 0,
        maxLength: MAX_CHUNK_SIZE,
        splitter: "paragraph",
        overlap: 0,
    });
    
    console.log(`Splitting into ${chunks.length} chunks`);
    // Ask before starting
    console.log("Press any key to continue");
    await new Promise(resolve => process.stdin.once('data', resolve));
    // Create audio folder, do not throw error if it exists
    await fs.mkdir("./audio").catch(() => {});

    const spinner = ora();
    spinner.start(`Processing chunks`);
    for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
        const promises = [];
        for (let j = 0; j < MAX_PARALLEL; j++) {
            const chunkContent = chunks[i + j];
            if (!chunkContent) break;

            const fileName = `./audio/speech-${i + j}.mp3`;
            promises.push(processChunk(chunkContent, fileName, spinner));
        }

        await Promise.all(promises);
    }
    
    spinner.succeed(`Finished processing chunks`);

    // Concatenate all files
    const ffmpeg = fluentFFmpeg();
    for (let i = 0; i < chunks.length; i++) {
        const fileName = `./audio/speech-${i}.mp3`;
        ffmpeg.input(fileName);
    }

    spinner.start('Merging files');
    await mergeFiles(ffmpeg, "./output.mp3", "./");
    spinner.succeed('Finished merging files');
    
    // Delete all files
    spinner.start('Deleting files');
    await fs.rm("./audio", { recursive: true });
    spinner.succeed('Finished deleting files');
}

main();
