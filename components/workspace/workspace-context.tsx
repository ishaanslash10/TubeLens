"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

export type TranscriptItem = {
  id?: number;
  text: string;
  offset: number;
  duration: number;
};

type WorkspaceContextType = {
  videoId: string;
  workspaceId: string | null;
  transcript: TranscriptItem[] | null;
  isLoadingTranscript: boolean;
  transcriptError: string | null;
  transcriptErrorCode: string | null;
  transcriptSource: "youtube" | "whisper" | null;
  
  // Local STT
  localSTTStatus: "idle" | "requesting" | "capturing" | "transcribing" | "complete" | "error" | "unsupported";
  startLocalSTT: () => void;
  stopLocalSTT: () => void;
  localSTTProgress: number; // 0 to 100
  
  // Hidden Transcriber Player API
  transcriberReady: boolean;
  setTranscriberPlayer: (player: any) => void;
  setTranscriberState: (state: number) => void;
  
  // Main Player API
  currentTime: number;
  setCurrentTime: (time: number) => void;
  playerReady: boolean;
  playerState: number;
  playerError: number | null;
  seekTo: (time: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  playerRef: React.MutableRefObject<any>;
  setPlayer: (player: any) => void;
  setPlayerState: (state: number) => void;
  setPlayerError: (error: number | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ 
  children, 
  videoId,
  workspaceId
}: { 
  children: React.ReactNode; 
  videoId: string;
  workspaceId: string | null;
}) {
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(true);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptErrorCode, setTranscriptErrorCode] = useState<string | null>(null);
  const [transcriptSource, setTranscriptSource] = useState<"youtube" | "whisper" | null>(null);
  
  const [localSTTStatus, setLocalSTTStatus] = useState<WorkspaceContextType["localSTTStatus"]>("idle");
  const [localSTTProgress, setLocalSTTProgress] = useState(0);
  
  const localSTTBufferRef = useRef<number[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const captureBaseTimeRef = useRef<number>(0);
  const baseTimeQueueRef = useRef<number[]>([]);

  const isCapturingRef = useRef<boolean>(false);
  
  // Audio state restoration
  const prevPlayerMutedRef = useRef<boolean | null>(null);
  const prevPlayerVolumeRef = useRef<number | null>(null);
  
  // Native Capture Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Transcriber Player Refs
  const transcriberPlayerRef = useRef<any>(null);
  const [transcriberReady, setTranscriberReady] = useState(false);
  const transcriberStateRef = useRef<number>(-1);

  // Main Player Refs
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [playerError, setPlayerError] = useState<number | null>(null);
  const playerRef = useRef<any>(null);

  const setPlayer = useCallback((player: any) => {
    playerRef.current = player;
    setPlayerReady(!!player);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time, true);
    }
  }, []);

  const playVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  }, []);
  
  const setTranscriberPlayer = useCallback((player: any) => {
    transcriberPlayerRef.current = player;
    setTranscriberReady(!!player);
  }, []);

  const setTranscriberState = useCallback((state: number) => {
    transcriberStateRef.current = state;
    if (state === 0 && isCapturingRef.current) {
      // Video ended
      stopLocalSTT();
      setLocalSTTStatus("complete");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setPlayerError(null);
    setLocalSTTStatus("idle");
    setTranscriptSource(null);
    setTranscriptErrorCode(null);
    
    async function fetchTranscript() {
      try {
        setIsLoadingTranscript(true);
        const res = await fetch(`/api/transcript?videoId=${videoId}`);
        const data = await res.json();
        
        if (isMounted) {
          if (!res.ok || data.error) {
            setTranscriptError(data.error || "Failed to load transcript");
            setTranscriptErrorCode(data.code || (res.status === 404 ? "CAPTIONS_UNAVAILABLE" : "SERVER_ERROR"));
          } else {
            setTranscript(data.transcript);
            setTranscriptSource("youtube");
            setTranscriptError(null);
            setTranscriptErrorCode(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setTranscriptError("Could not load transcript for this video.");
          setTranscriptErrorCode("NETWORK_ERROR");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTranscript(false);
        }
      }
    }

    fetchTranscript();

    return () => {
      isMounted = false;
      stopLocalSTT();
    };
  }, [videoId]);

  // Handle Local STT Initialization
  const startLocalSTT = useCallback(async () => {
    if (localSTTStatus === "capturing" || localSTTStatus === "requesting") return;
    
    setLocalSTTStatus("requesting");
    setTranscriptError(null);
    setTranscript([]);
    setTranscriptSource("whisper");
    localSTTBufferRef.current = [];
    captureBaseTimeRef.current = 0;
    baseTimeQueueRef.current = [];
    
    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../../lib/whisper/worker.ts', import.meta.url), {
          type: 'module'
        });
        
        workerRef.current.onmessage = (e) => {
          const { type, result, error } = e.data;
          
          if (type === "complete") {
            console.log("[STT] Worker returned COMPLETE:", result);
          }
          if (type === "complete" && result && result.chunks) {
            console.log(`[STT] WHISPER_RESULT text="${result.text.substring(0, 30)}..." chunks=${result.chunks?.length}`);
            if (result.text.trim() === "") console.log("[STT] WHISPER_RESULT_EMPTY");
            setTranscript(prev => {
              console.log(`[STT] TRANSCRIPT_BEFORE=${prev?.length || 0}`);
              const baseTime = baseTimeQueueRef.current.shift() || 0;
              const newSegments = result.chunks
                .filter((c: any) => !c.timestamp || c.timestamp[0] < 25) // Safely discard 5s overlap
                .map((c: any) => {
                  const start = c.timestamp ? c.timestamp[0] : 0;
                  const end = c.timestamp ? (c.timestamp[1] ?? (start + 5)) : 5;
                  return {
                    text: c.text.trim(),
                    offset: baseTime + start,
                    duration: end - start
                  };
                });
              console.log(`[STT] CANONICAL_SEGMENTS=${newSegments.length}`);
              console.log(`[STT] TRANSCRIPT_AFTER=${(prev?.length || 0) + newSegments.length}`);
              if (newSegments.length > 0) {
                console.log(`[STT] FIRST_NEW_SEGMENT: ${JSON.stringify(newSegments[0])}`);
              }
              return [...(prev || []), ...newSegments];
            });
            
            if (isCapturingRef.current) {
              setLocalSTTStatus("capturing");
            } else if (transcriberStateRef.current === 0) {
              setLocalSTTStatus("complete");
            } else {
               setLocalSTTStatus("idle");
            }
          } else if (type === "error") {
            console.error("Whisper Worker Error:", error);
            setLocalSTTStatus("error");
            setTranscriptError("Local transcription failed: " + error);
          }
        };
        
        workerRef.current.postMessage({ type: "init" });
      }

      // Mute main player FIRST to avoid double audio during prompt
      if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
        prevPlayerMutedRef.current = playerRef.current.isMuted();
        prevPlayerVolumeRef.current = playerRef.current.getVolume();
        playerRef.current.mute();
      }

      // Immediately unlock transcriber player while user gesture is active
      if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.playVideo === 'function') {
        transcriberPlayerRef.current.playVideo();
      }

      console.log(`[STT] PLAYER_READY=${!!transcriberPlayerRef.current}`);
      console.log(`[STT] PLAYER_STATE=${transcriberStateRef.current}`);

      // Native getDisplayMedia
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
        audio: true,
        preferCurrentTab: true
      } as any);



      // Verify audio
      console.log(`[STT] CAPTURE_STREAM_ID=${stream.id}`);
      const audioTracks = stream.getAudioTracks();
      console.log(`[STT] CAPTURE_AUDIO_TRACKS=${audioTracks.length}`);
      if (audioTracks[0]) {
        console.log(`[STT] TRACK_READY_STATE=${audioTracks[0].readyState}`);
        console.log(`[STT] TRACK_MUTED=${audioTracks[0].muted}`);
        console.log(`[STT] TRACK_SETTINGS=${JSON.stringify(audioTracks[0].getSettings())}`);
      }
      if (audioTracks.length === 0) {
        console.log(`[STT] CAPTURE_AUDIO_TRACKS=0 - Browser unsupported or user denied audio.`);
        stream.getTracks().forEach(t => t.stop());
        
        // Stop transcriber player immediately
        if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.pauseVideo === 'function') {
          transcriberPlayerRef.current.pauseVideo();
        }
        
        // Restore main player immediately
        if (playerRef.current && typeof playerRef.current.unMute === 'function') {
          if (prevPlayerMutedRef.current === false) playerRef.current.unMute();
          if (prevPlayerVolumeRef.current !== null) playerRef.current.setVolume(prevPlayerVolumeRef.current);
          prevPlayerMutedRef.current = null;
          prevPlayerVolumeRef.current = null;
        }
        
        setLocalSTTStatus("unsupported");
        return; // Halt pipeline
      }

      // Do NOT stop the video track immediately!
      // Stopping the video track of an active tab capture in Chromium while keeping the audio track alive 
      // corrupts the GPU compositor and results in RGB/static noise over hardware-accelerated video iframes.
      // We will simply ignore the video track, letting it live until stopLocalSTT cleans up the entire stream.

      // Reset transcriber player to 0:00 now that capture has explicitly started
      if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.seekTo === 'function') {
        transcriberPlayerRef.current.seekTo(0, true);
      }

      // Sync captureBaseTime with the player's actual time
      const pollTime = setInterval(() => {
        if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.getCurrentTime === 'function') {
          const duration = transcriberPlayerRef.current.getDuration() || 1;
          const current = transcriberPlayerRef.current.getCurrentTime();
          if (isCapturingRef.current) {
            console.log(`[STT] PLAYER_TIME=${current.toFixed(2)} / ${duration.toFixed(2)} | STATE=${transcriberStateRef.current}`);
          }
          setLocalSTTProgress(Math.min(100, Math.round((current / duration) * 100)));
        }
      }, 1000);
      (window as any).__transcriberPoll = pollTime;

      // Web Audio processing
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      console.log(`[STT] AUDIO_CONTEXT_STATE=${audioCtx.state}`);
      console.log(`[STT] AUDIO_SAMPLE_RATE=${audioCtx.sampleRate}`);
      audioCtxRef.current = audioCtx;
      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // Prevent feedback loop
      gainNodeRef.current = gainNode;

      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      isCapturingRef.current = true;
      setLocalSTTStatus("capturing");
      captureBaseTimeRef.current = 0;


      processor.onaudioprocess = (e) => {
        if (!isCapturingRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        localSTTBufferRef.current.push(...Array.from(inputData));
        
        if (localSTTBufferRef.current.length % 64000 === 0) {
           let sumSq = 0;
           for(let i=0; i<inputData.length; i++) sumSq += inputData[i]*inputData[i];
           const rms = Math.sqrt(sumSq / inputData.length);
           if (rms === 0 || isNaN(rms)) {
             console.log("[STT] AUDIO IS SILENT AT WEB AUDIO INPUT (RMS=0)");
           } else {
             console.log(`[STT] PCM_RMS=${rms.toFixed(5)} | Buffer=${localSTTBufferRef.current.length}`);
           }
        }
        // --------------------------
        
        // 30s of 16kHz = 480,000 samples
        if (localSTTBufferRef.current.length >= 480000) {
          if (workerRef.current) {
             setLocalSTTStatus("transcribing");
             
             // Sync absolute time to prevent drift over hours
             if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.getCurrentTime === 'function') {
                const actualTime = transcriberPlayerRef.current.getCurrentTime();
                // We are about to process a 30s chunk. It ends near `actualTime`.
                // So the chunk started near `actualTime - 30`. We snap it to avoid drift.
                // But for robust overlapping, we just use mathematical advancement.
             }

             const audioData = new Float32Array(localSTTBufferRef.current);
             console.log(`[STT] CHUNK_READY start=${captureBaseTimeRef.current} duration=30 samples=${audioData.length}`);
             console.log(`[STT] WHISPER_START baseTime=${captureBaseTimeRef.current} samples=${audioData.length}`);
             baseTimeQueueRef.current.push(captureBaseTimeRef.current);
             workerRef.current.postMessage({ type: "transcribe", audioData });
             
             // Keep 5s (80,000 samples) as overlap. Advance by 25s (400,000 samples).
             captureBaseTimeRef.current += 25;
             localSTTBufferRef.current = localSTTBufferRef.current.slice(400000);
          }
        }
      };

      audioTracks[0].onended = () => {
        stopLocalSTT();
      };

    } catch (err: any) {
      // Ensure cleanup and unmute happens on error
      if (playerRef.current && typeof playerRef.current.unMute === 'function') {
        if (prevPlayerMutedRef.current === false) playerRef.current.unMute();
        if (prevPlayerVolumeRef.current !== null) playerRef.current.setVolume(prevPlayerVolumeRef.current);
        prevPlayerMutedRef.current = null;
        prevPlayerVolumeRef.current = null;
      }
      setLocalSTTStatus("error");
      setTranscriptError(err.name === 'NotAllowedError' ? 'Permission denied.' : err.message || "Capture failed.");
    }
  }, [localSTTStatus]);

  const stopLocalSTT = useCallback(() => {
    isCapturingRef.current = false;
    
    // Restore main player audio
    if (playerRef.current && typeof playerRef.current.unMute === 'function') {
      if (prevPlayerMutedRef.current === false) {
        playerRef.current.unMute();
      }
      if (prevPlayerVolumeRef.current !== null) {
        playerRef.current.setVolume(prevPlayerVolumeRef.current);
      }
      prevPlayerMutedRef.current = null;
      prevPlayerVolumeRef.current = null;
    }
    
    if ((window as any).__transcriberPoll) {
      clearInterval((window as any).__transcriberPoll);
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (transcriberPlayerRef.current && typeof transcriberPlayerRef.current.pauseVideo === 'function') {
      transcriberPlayerRef.current.pauseVideo();
    }

    // Flush remaining
    if (localSTTBufferRef.current.length > 0 && workerRef.current) {
      setLocalSTTStatus("transcribing");
      const audioData = new Float32Array(localSTTBufferRef.current);
      baseTimeQueueRef.current.push(captureBaseTimeRef.current);
      workerRef.current.postMessage({ type: "transcribe", audioData });
      localSTTBufferRef.current = [];
    } else {
      if (localSTTStatus === "capturing" || localSTTStatus === "requesting") {
        setLocalSTTStatus("idle");
      }
    }
  }, [localSTTStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if ((window as any).__transcriberPoll) {
        clearInterval((window as any).__transcriberPoll);
      }
    };
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      videoId,
      workspaceId,
      transcript,
      isLoadingTranscript,
      transcriptError,
      transcriptErrorCode,
      transcriptSource,
      
      localSTTStatus,
      startLocalSTT,
      stopLocalSTT,
      localSTTProgress,
      
      transcriberReady,
      setTranscriberPlayer,
      setTranscriberState,
      
      currentTime,
      setCurrentTime,
      playerReady,
      playerState,
      playerError,
      seekTo,
      playVideo,
      pauseVideo, playerRef,
      
      setPlayer,
      setPlayerState,
      setPlayerError
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
