import fs from 'fs/promises';

import ora from 'ora';
import { chunk } from 'llm-chunk';
import fluentFFmpeg from 'fluent-ffmpeg';

import dotenv from 'dotenv';
dotenv.config();

import { mergeFiles, processChunkWithRetry } from './utils.js';
import { argv, exit } from 'process';

const MAX_PARALLEL = process.env.MAX_PARALLEL || 5;
const MAX_CHUNK_SIZE = process.env.MAX_CHUNK_SIZE || 3000;
const INPUT_FILE = process.env.INPUT_FILE || argv[2] || './input.txt';
const OUTPUT_FILE = process.env.OUTPUT_FILE || argv[3] || `./output-${Date.now()}.mp3`;
const PRICE_PER_CHARACTER = 0.015 / 1000 // See https://openai.com/pricing


const main = async () => {
    const inputText = await fs.readFile(INPUT_FILE, 'utf-8');
    const chunks = chunk(inputText, {
        minLength: 0,
        maxLength: MAX_CHUNK_SIZE,
        splitter: 'sentence',
        overlap: 0,
    });

    console.log(`Splitting into ${chunks.length} chunks. Total length: ${inputText.length}, estimated cost ${(inputText.length * PRICE_PER_CHARACTER).toFixed(3)} USD`);
    // Ask before starting
    console.log('Press any key to continue');
    await new Promise(resolve => process.stdin.once('data', resolve));
    // Create audio folder, do not throw error if it exists
    await fs.mkdir('./audio').catch(() => { });

    const spinner = ora();
    spinner.start(`Processing chunks`);

    const succeeded = [];
    for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
        const promises = [];
        for (let j = 0; j < MAX_PARALLEL; j++) {
            const chunkContent = chunks[i + j];
            if (!chunkContent) break;

            const fileName = `./audio/speech-${i + j}.mp3`;
            promises.push(processChunkWithRetry(chunkContent, fileName, spinner));
        }

        const finishedPromises = await Promise.allSettled(promises);
        finishedPromises.forEach((promise, index) => {
            if (promise.status === 'fulfilled') {
                succeeded.push(promise.value);
            } else {
                console.error(promise.reason);
                spinner.fail(`Failed processing chunk ${i + index}`);
            }
        });
    }

    spinner.succeed(`Finished processing chunks`);

    // Concatenate all files
    const ffmpeg = fluentFFmpeg();
    succeeded.sort().forEach(fileName => ffmpeg.input(fileName));

    spinner.start('Merging files');
    await mergeFiles(ffmpeg, OUTPUT_FILE, './');
    spinner.succeed('Finished merging files. Output file: ' + OUTPUT_FILE);

    // Delete all files
    spinner.start('Deleting files');
    await fs.rm('./audio', { recursive: true });
    spinner.succeed('Finished deleting files');
    exit(0);
}

main();
