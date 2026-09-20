import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { videoId, transcriptText } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    const ai = new GoogleGenAI({});
    
    const safeTranscriptText = transcriptText ? transcriptText.slice(0, 50000) : "";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Generate a comprehensive mind map of the core concepts in this video.",
      config: {
        systemInstruction: `You are TubeLens. Create a Mermaid.js mindmap summarizing the key concepts of the provided video transcript.
Use the standard Mermaid mindmap syntax:
mindmap
  root((Main Topic))
    Concept 1
      Detail 1
      Detail 2
    Concept 2
      Detail 3

Return ONLY the raw Mermaid code block. Do not include markdown formatting like \`\`\`mermaid or \`\`\`.

Transcript:
${safeTranscriptText}
`
      }
    });

    let mermaidCode = response.text || "";
    // Clean up if it returned markdown
    mermaidCode = mermaidCode.replace(/^```(?:mermaid)?\n/g, "").replace(/```$/g, "").trim();

    return NextResponse.json({ mermaid: mermaidCode });
  } catch (error) {
    console.error("Failed to generate mind map:", error);
    return NextResponse.json(
      { error: "Could not generate mind map." },
      { status: 500 }
    );
  }
}
