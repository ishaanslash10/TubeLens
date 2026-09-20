import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Normalize youtube-transcript v1.3.1 milliseconds into standard seconds 
    // for the entire TubeLens application.
    const transcript = rawTranscript.map((segment) => ({
      ...segment,
      offset: (typeof segment.offset === 'number' ? segment.offset : 0) / 1000,
      duration: (typeof segment.duration === 'number' ? segment.duration : 0) / 1000,
    }));

    return NextResponse.json({ transcript, source: "youtube" });
  } catch (error: any) {
    console.error("Failed to fetch transcript:", error);
    
    const errorMsg = error?.message || "";
    const isUnavailable = errorMsg.includes("Transcript is disabled") || 
                          errorMsg.includes("No transcripts are available") ||
                          errorMsg.includes("Could not find captions");
    
    if (isUnavailable) {
      return NextResponse.json(
        { error: "Captions genuinely unavailable", code: "CAPTIONS_UNAVAILABLE" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Could not fetch transcript for this video." },
      { status: 500 }
    );
  }
}
