import fs from 'fs/promises';

import ora from 'ora';
import { chunk } from 'llm-chunk';
import fluentFFmpeg from 'fluent-ffmpeg';

import dotenv from 'dotenv';
dotenv.config();

import { mergeFiles, processChunk } from './utils.js';
import { argv } from 'process';

const MAX_PARALLEL = process.env.MAX_PARALLEL || 5;
const MAX_CHUNK_SIZE = process.env.MAX_CHUNK_SIZE || 3000;
const INPUT_FILE = process.env.INPUT_FILE || argv[2] || './input.txt';
const OUTPUT_FILE = process.env.OUTPUT_FILE || argv[3] || './output.mp3';

const main = async () => {
    const inputText = await fs.readFile(INPUT_FILE, 'utf-8');
    const chunks = chunk(inputText, {
        minLength: 0,
        maxLength: MAX_CHUNK_SIZE,
        splitter: 'paragraph',
        overlap: 0,
    });

    console.log(`Splitting into ${chunks.length} chunks`);
    // Ask before starting
    console.log('Press any key to continue');
    await new Promise(resolve => process.stdin.once('data', resolve));
    // Create audio folder, do not throw error if it exists
    await fs.mkdir('./audio').catch(() => { });

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
    await mergeFiles(ffmpeg, OUTPUT_FILE, './');
    spinner.succeed('Finished merging files');

    // Delete all files
    spinner.start('Deleting files');
    await fs.rm('./audio', { recursive: true });
    spinner.succeed('Finished deleting files');
}

main();
