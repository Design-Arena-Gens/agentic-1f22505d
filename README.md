# SonicScribe – AI Podcast Generator

SonicScribe turns long-form content into polished podcast episodes. Paste raw text, share an article URL, or drop a YouTube link and the app will draft a structured script, synthesize narration with AI voices, and return a downloadable MP3.

## Features

- Text ➜ podcast: paste notes, blog posts, or scripts.
- URL ➜ podcast: scrape and summarize long-form articles.
- YouTube ➜ podcast: pull public transcripts and adapt them for audio.
- Multi-step AI pipeline: source extraction → script writing → voice synthesis.
- Instant episode preview with audio playback and download.

## Tech Stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- React 18 + TypeScript
- Tailwind CSS
- OpenAI Responses + TTS APIs
- Cheerio + youtube-transcript for content ingestion

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- An `OPENAI_API_KEY` with access to Responses + TTS endpoints

### Setup

```bash
npm install

# create a local env file
cp .env.example .env.local
```

Update `.env.local` with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Quality Gates

```bash
npm run lint
npm run build
```

## Deployment

Set the `OPENAI_API_KEY` environment variable in your hosting platform (e.g., Vercel), then deploy as usual.

## Notes

- Webpage scraping strips scripts/styles and keeps the most relevant text chunk.
- YouTube transcripts must be publicly accessible; private videos will fail.
- Audio synthesis uses OpenAI `gpt-4o-mini-tts` voices (`alloy`, `verse`, `luna`).
