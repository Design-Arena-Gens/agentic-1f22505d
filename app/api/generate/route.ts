import { NextResponse } from "next/server";
import { z } from "zod";
import { extractFromUrl, extractFromYouTube } from "@/lib/content";
import { buildScriptPrompt } from "@/lib/prompt";
import { getOpenAIClient } from "@/lib/openai";

const requestSchema = z
  .object({
    mode: z.enum(["text", "url", "video"]),
    voice: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[a-z-]+$/i, "Voice id must be alphanumeric or hyphenated")
      .default("alloy"),
    content: z.string().min(50, "Provide at least 50 characters of text."),
    url: z.string().url(),
    videoUrl: z.string().url()
  })
  .partial({
    content: true,
    url: true,
    videoUrl: true
  });

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid request payload." },
        { status: 400 }
      );
    }

    const { mode, voice } = parsed.data;
    let sourceText: string | null = null;
    let origin: string | undefined;

    if (mode === "text") {
      const content = parsed.data.content ?? "";
      sourceText = content.trim();
      if (sourceText.length < 50) {
        return NextResponse.json(
          { error: "Please provide at least 50 characters of text." },
          { status: 400 }
        );
      }
    } else if (mode === "url") {
      const url = parsed.data.url;
      if (!url) {
        return NextResponse.json(
          { error: "Missing URL for webpage mode." },
          { status: 400 }
        );
      }
      origin = url;
      sourceText = await extractFromUrl(url);
    } else if (mode === "video") {
      const videoUrl = parsed.data.videoUrl;
      if (!videoUrl) {
        return NextResponse.json(
          { error: "Missing video URL for YouTube mode." },
          { status: 400 }
        );
      }
      origin = videoUrl;
      sourceText = await extractFromYouTube(videoUrl);
    }

    if (!sourceText) {
      return NextResponse.json(
        { error: "Unable to derive source material for the podcast." },
        { status: 422 }
      );
    }

    const openai = getOpenAIClient();

    const scriptPrompt = buildScriptPrompt({
      sourceSummary: sourceText,
      mode,
      origin
    });

    const scriptResponse = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_output_tokens: 1400,
      input: [
        {
          role: "system",
          content:
            "You are an Emmy-award winning podcast showrunner and head writer. You craft structured, compelling scripts that balance storytelling flair with factual clarity."
        },
        {
          role: "user",
          content: scriptPrompt
        }
      ]
    });

    const script = scriptResponse.output_text?.trim();

    if (!script || script.length === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to generate a script. Try again with different source material."
        },
        { status: 502 }
      );
    }

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: script
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      script,
      audioBase64
    });
  } catch (error) {
    console.error("[generate] error", error);

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("Failed to fetch")
        ? 500
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
