# Article to audio

This tool is a command-line utility for processing large amounts of text using OpenAI's Text-to-Speech (TTS) API, like reading article or books. It reads a text file, splits it into chunks, converts each chunk into speech using OpenAI TTS, and finally merges the resulting audio files into a single output file.

## Prerequisites

Before using this tool, ensure you have the following:

- Node.js installed on your machine
- OpenAI API key
- ffmpeg installed on your machine (for merging audio files)
- A text file (`input.txt`) containing the text you want to convert to speech

## Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/AlexRazor1337/article-to-audio
   ```

2. Navigate to the project directory:

   ```bash
   cd article-to-audio
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your-api-key
   ```
   
   Other optional parameters can be added to the `.env` file. See the [Configuration](#configuration) section for details.

## Usage

1. Place the text you want to convert in a file named `input.txt` in the project root.

2. Run the tool:

   ```bash
   node index.js
   ```

3. Follow the on-screen instructions. Press any key to start the processing.

4. The tool will create an `audio` folder in the project directory and generate individual audio files for each chunk.

5. After processing all chunks, the tool will merge the audio files into a single output file named `output.mp3`.

6. Once the merging is complete, the intermediate audio files will be deleted, leaving only the `output.mp3` file.

## Configuration

You can customize the following parameters in the `.env` file:

- `MAX_PARALLEL`: The maximum number of chunks to process simultaneously.
- `MAX_CHUNK_SIZE`: The maximum size of each chunk in characters.
- Other OpenAI TTS parameters (e.g., `model` and `voice`) can be adjusted in the `tts` function.

## Disclaimer

This tool is provided as-is, and the user is responsible for compliance with OpenAI's usage policies and terms.

## License

This tool is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
