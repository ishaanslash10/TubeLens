export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { Innertube, UniversalCache } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    // Primary robust fetch via youtubei.js
    const youtube = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    
    const info = await youtube.getInfo(videoId);
    if (!info.captions || !info.captions.caption_tracks) {
      throw new Error("Transcript is disabled");
    }
    
    const tracks = info.captions.caption_tracks;
    const track = tracks.find(t => t.language_code.startsWith('en')) || tracks[0];
    
    const trackUrl = track.base_url + '&fmt=json3';
    const res = await fetch(trackUrl);
    const data = await res.json();
    
    if (!data.events) {
      throw new Error("Transcript is disabled");
    }
    
    const transcript = [];
    for (const event of data.events) {
      if (!event.segs) continue;
      const text = event.segs.map((s: any) => s.utf8).join('').trim();
      if (text !== '\n' && text !== '') {
        transcript.push({
          text: text,
          offset: (event.tStartMs || 0) / 1000,
          duration: (event.dDurationMs || 0) / 1000
        });
      }
    }

    return NextResponse.json({ transcript, source: "youtube" });
  } catch (error: any) {
    console.error("Failed to fetch transcript with youtubei.js:", error);
    
    // Fallback to youtube-transcript
    try {
      const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      const transcript = rawTranscript.map((segment) => ({
        ...segment,
        offset: (typeof segment.offset === 'number' ? segment.offset : 0) / 1000,
        duration: (typeof segment.duration === 'number' ? segment.duration : 0) / 1000,
      }));
      return NextResponse.json({ transcript, source: "youtube" });
    } catch (fallbackError: any) {
      const errorMsg = fallbackError?.message || error?.message || "";
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
}
