import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({});
    const { videoTitle, transcriptText } = await req.json();

    if (!videoTitle) {
      return NextResponse.json({ error: "videoTitle is required" }, { status: 400 });
    }

    const safeTranscriptText = transcriptText ? transcriptText.slice(0, 5000) : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `YouTube title: "${videoTitle}"\n\nTranscript snippet:\n${safeTranscriptText}`,
      config: {
        systemInstruction: `Create a concise 3-7 word workspace title that captures the main subject/theme of this video. Make it feel like a natural research/session title, not a copy of the YouTube title. Avoid clickbait. Avoid emojis unless genuinely appropriate. Avoid quotation marks. Avoid unnecessary punctuation. Never include the YouTube video ID. Provide ONLY the title text as your output, nothing else.`
      }
    });

    return NextResponse.json({ title: response.text?.trim()?.replace(/^["']|["']$/g, '') });
  } catch (error) {
    console.error("Workspace Title AI Error:", error);
    return NextResponse.json({ error: "Failed to generate title." }, { status: 500 });
  }
}
