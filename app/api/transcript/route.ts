export const runtime = 'nodejs';
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
    // Direct InnerTube POST via youtube.actions.execute to bypass HTML scraping entirely
    const youtube = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    
    const res = await youtube.actions.execute('/player', {
      videoId: videoId,
      client: 'ANDROID',
      parse: false
    });
    
    const data = res.data;
    const hasTracks = !!(data?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
    
    if (!hasTracks || !data?.captions) {
      throw new Error("Transcript is disabled");
    }
    
    const tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
    const track = tracks.find((t: any) => t.languageCode.startsWith('en')) || tracks[0];
    
    let trackUrl = track.baseUrl;
    if (trackUrl.includes('fmt=srv3')) {
      trackUrl = trackUrl.replace('fmt=srv3', 'fmt=json3');
    } else {
      trackUrl += '&fmt=json3';
    }
    
    const subRes = await fetch(trackUrl);
    const subData = await subRes.json();
    
    if (!subData.events) {
      throw new Error("Transcript is disabled");
    }
    
    const transcript = [];
    for (const event of subData.events) {
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
