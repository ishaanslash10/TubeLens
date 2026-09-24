export const runtime = 'nodejs';
export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { Innertube, UniversalCache } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  // 1. Primary Provider: Supadata (Sequential Failover Pipeline)
  const supadataKeys = [
    process.env.SUPADATA_API_KEY_1,
    process.env.SUPADATA_API_KEY_2,
    process.env.SUPADATA_API_KEY_3
  ].filter(Boolean);

  let supadataSucceeded = false;

  for (let i = 0; i < supadataKeys.length; i++) {
    const key = supadataKeys[i];
    try {
      const supadataRes = await fetch(`https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'x-api-key': key!,
          'Accept': 'application/json'
        }
      });
      
      if (supadataRes.ok) {
        const data = await supadataRes.json();
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
          const transcript = data.content
            .filter((segment: any) =>
              typeof segment?.text === "string" &&
              segment.text.trim().length > 0 &&
              typeof segment?.offset === "number" &&
              Number.isFinite(segment.offset) &&
              typeof segment?.duration === "number" &&
              Number.isFinite(segment.duration)
            )
            .map((segment: any) => ({
              text: segment.text,
              offset: segment.offset / 1000,
              duration: segment.duration / 1000
            }));
            
          if (transcript.length > 0) {
            supadataSucceeded = true;
            return NextResponse.json({ transcript, source: "supadata" });
          } else {
            console.warn(`Supadata API returned data on key ${i+1}, but all segments were malformed.`);
            // Content error, do not burn more keys
            break;
          }
        } else {
            console.warn(`Supadata API returned empty/invalid content on key ${i+1}.`);
            break; // Content error, do not burn more keys
        }
      } else {
        const status = supadataRes.status;
        const retryable = [401, 402, 403, 429, 500, 502, 503, 504].includes(status);
        
        if (retryable) {
          if (status === 403) {
            let isQuotaOrPlanError = false;
            try {
              const errorBody = await supadataRes.text();
              const errorStr = errorBody.toLowerCase();
              isQuotaOrPlanError = errorStr.includes('quota') || errorStr.includes('plan') || errorStr.includes('subscription') || errorStr.includes('permission') || errorStr.includes('limit');
            } catch (e) {}
            
            if (!isQuotaOrPlanError) {
              console.warn(`Supadata API returned 403 content restriction on key ${i+1}. Skipping remaining keys and falling back.`);
              break;
            }
          }
          console.warn(`Supadata key ${i+1} failed with retryable status ${status}, trying next key if available.`);
          continue;
        } else {
          console.warn(`Supadata API returned non-retryable error (status ${status}) on key ${i+1}. Skipping remaining keys and falling back.`);
          break;
        }
      }
    } catch (supadataError) {
      console.error(`Supadata request network error on key ${i+1}, trying next key if available:`, supadataError);
      continue;
    }
  }

  if (!supadataSucceeded && supadataKeys.length > 0) {
    console.warn("All available Supadata keys failed or returned content errors; falling back to InnerTube.");
  }

  try {
    // Direct InnerTube POST via youtube.actions.execute to bypass HTML scraping entirely
    const youtube = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    
    const res = await youtube.actions.execute('/player', {
      videoId: videoId,
      client: 'WEB_EMBEDDED',
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
