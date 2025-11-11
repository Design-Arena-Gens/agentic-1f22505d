"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mic2, Newspaper, Video } from "lucide-react";
import Image from "next/image";

type GenerationMode = "text" | "url" | "video";

interface GenerateResponse {
  script: string;
  audioBase64: string;
}

const voices = [
  { id: "alloy", label: "Alloy - Warm Narrator" },
  { id: "verse", label: "Verse - Conversational" },
  { id: "luna", label: "Luna - Friendly Host" }
];

const tabs: { id: GenerationMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "text",
    label: "Text",
    icon: <Mic2 className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
  },
  {
    id: "url",
    label: "Web URL",
    icon: <Newspaper className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
  },
  {
    id: "video",
    label: "YouTube",
    icon: <Video className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
  }
];

function useAudioUrl(base64: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!base64) {
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    const binary = atob(base64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const objectUrl = URL.createObjectURL(blob);
    setUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [base64]);

  return url;
}

export default function HomePage() {
  const [mode, setMode] = useState<GenerationMode>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [voice, setVoice] = useState<string>(voices[0]?.id ?? "alloy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const hasContent = useMemo(() => {
    switch (mode) {
      case "text":
        return textInput.trim().length > 0;
      case "url":
        return urlInput.trim().length > 0;
      case "video":
        return videoInput.trim().length > 0;
      default:
        return false;
    }
  }, [mode, textInput, urlInput, videoInput]);

  const audioUrl = useAudioUrl(result?.audioBase64 ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasContent || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: Record<string, unknown> = {
        mode,
        voice
      };

      if (mode === "text") {
        payload["content"] = textInput;
      } else if (mode === "url") {
        payload["url"] = urlInput;
      } else if (mode === "video") {
        payload["videoUrl"] = videoInput;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ??
            "We could not produce the podcast. Try again with different content."
        );
      }

      const data: GenerateResponse = await res.json();
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the podcast.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function renderInput() {
    switch (mode) {
      case "text":
        return (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your blog post, script, or notes here..."
            className="min-h-[200px] w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        );
      case "url":
        return (
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        );
      case "video":
        return (
          <input
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        );
      default:
        return null;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 md:px-10">
      <header className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/60">
          <Image
            src="/logo.svg"
            alt="SonicScribe logo"
            fill
            sizes="64px"
            priority
            className="p-3"
          />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            SonicScribe
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            AI podcast studio that turns long-form content into binge-worthy
            audio episodes. Paste your text, share a link, or drop a YouTube
            video—we&apos;ll craft a structured script, pick a voice, and
            deliver polished audio in minutes.
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <form
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  mode === tab.id
                    ? "border-indigo-500 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-transparent text-slate-300 hover:border-white/30"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">{renderInput()}</div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Voice
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {voices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Episode Length
              </label>
              <span className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-slate-300">
                Auto-detected from source (5–12 minutes)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!hasContent || loading}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Mixing your episode…
              </>
            ) : (
              <>
                <Mic2 className="h-4 w-4" aria-hidden />
                Generate Podcast
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          )}
        </form>

        <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
          <div className="space-y-3">
            <h2 className="text-xl font-medium text-white md:text-2xl">
              Episode Preview
            </h2>
            <p className="text-sm text-slate-300">
              You&apos;ll get a clean script, chapter markers, and a polished MP3
              download ready for distribution.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
              Podcast Script
            </h3>
            {result?.script ? (
              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto text-sm leading-relaxed text-slate-100">
                {result.script.split("\n").map((line, index) => (
                  <p key={`${line}-${index}`} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-400">
                <p>• Cold open hook tailored to your topic</p>
                <p>• Narrative beats with transitions and teasers</p>
                <p>• Outro with call-to-action and episode summary</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
              Audio Mixdown
            </h3>
            {audioUrl ? (
              <div className="mt-4 space-y-4">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full"
                  preload="metadata"
                >
                  Your browser does not support the audio tag.
                </audio>
                <a
                  href={audioUrl}
                  download="sonicscribe-episode.mp3"
                  className="inline-flex items-center justify-center rounded-xl border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-400/20"
                >
                  Download MP3
                </a>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-400">
                <p>• Studio-grade narration with multi-voice options</p>
                <p>• Breathing and pacing adjustments for clarity</p>
                <p>• Export-ready MP3 for Apple Podcasts &amp; Spotify</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
