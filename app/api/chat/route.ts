import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({});
    const { message, videoId, transcriptText } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const safeTranscriptText = transcriptText ? transcriptText.slice(0, 50000) : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: message,
      config: {
        systemInstruction: `You are TubeLens, an AI companion for YouTube (working with video ID: ${videoId}).
Your core philosophy is "Understanding". 
Do not simply summarize videos. Instead, help the user explore, question, connect, and remember the concepts.
Be calm, thoughtful, and intelligent. Ask guiding questions to encourage active learning.

${safeTranscriptText ? `\nHere is the transcript for the current video. Each line starts with a segment ID like [15]:\n${safeTranscriptText}\n\nUse this transcript to ground your answers in reality and provide specific examples or quotes when helpful.

CRITICAL INSTRUCTION FOR TIMESTAMPS:
When citing or referencing specific moments in the video, you MUST use the exact segment ID from the transcript.
Format your reference exactly as: [cite:ID] (e.g. if the transcript says "[15] some text", you write [cite:15]).
DO NOT calculate, invent, or output literal timestamps like 02:51. The application will convert the [cite:ID] tag into a real interactive timestamp for the user.
You can include multiple citations if needed. Only use citations when explicitly referencing a specific moment or quote.` : ''}`
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
  }
}
