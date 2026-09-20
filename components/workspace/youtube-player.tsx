"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { VideoOff, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export function YouTubePlayer() {
  const { 
    videoId, 
    setPlayer, 
    setPlayerState, 
    setCurrentTime, 
    playerError, 
    setPlayerError,
    setTranscriberPlayer,
    setTranscriberState
  } = useWorkspace();
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const transcriberPlayerRef = useRef<any>(null);
  const transcriberContainerRef = useRef<HTMLDivElement>(null);
  
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const mainPlayerDiv = document.createElement("div");
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(mainPlayerDiv);
    }
    
    const transcriberPlayerDiv = document.createElement("div");
    if (transcriberContainerRef.current) {
      transcriberContainerRef.current.innerHTML = '';
      transcriberContainerRef.current.appendChild(transcriberPlayerDiv);
    }

    const initPlayers = () => {
      if (!window.YT || !window.YT.Player) return;
      
      // Main Player
      playerRef.current = new window.YT.Player(mainPlayerDiv, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            if (isMounted) setPlayer(event.target);
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            setPlayerState(event.data);
            
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                  if (playerRef.current && playerRef.current.getCurrentTime) {
                    setCurrentTime(playerRef.current.getCurrentTime());
                  }
                }, 500); 
              }
            } else {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          },
          onError: (event: any) => {
            if (!isMounted) return;
            if (event.data === 150 || event.data === 101) {
              setPlayerError(event.data);
            } else {
              console.error("YouTube Player Error", event.data);
            }
          }
        }
      });
      
      // Transcriber Player
      transcriberPlayerRef.current = new window.YT.Player(transcriberPlayerDiv, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          rel: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            if (isMounted) setTranscriberPlayer(event.target);
          },
          onStateChange: (event: any) => {
            if (isMounted) setTranscriberState(event.data);
          }
        }
      });
    };

    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayers();
      };
    } else {
      initPlayers();
    }

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
      if (transcriberPlayerRef.current) {
        try { transcriberPlayerRef.current.destroy(); } catch (e) {}
        transcriberPlayerRef.current = null;
      }
      setPlayer(null);
      setTranscriberPlayer(null);
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (transcriberContainerRef.current) transcriberContainerRef.current.innerHTML = '';
    };
  }, [videoId, setPlayer, setPlayerState, setCurrentTime, setPlayerError, setTranscriberPlayer, setTranscriberState]);

  const isEmbedRestricted = playerError === 150 || playerError === 101;

  return (
    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
      {/* Hidden Transcriber Player */}
      <div 
        ref={transcriberContainerRef} 
        className="absolute w-full h-full -z-50 pointer-events-none" 
        aria-hidden="true" 
      />

      {isEmbedRestricted && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 p-6 text-center overflow-y-auto">
          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4 border border-border/50 shrink-0">
            <VideoOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-white font-semibold mb-2 text-lg">This video can't be played here</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-2">
            The video owner has disabled embedded playback.
          </p>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Keep the video beside your research with Picture-in-Picture.
          </p>
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary text-background hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors mb-6 shrink-0"
          >
            Continue on YouTube
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="max-w-xs w-full shrink-0">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              aria-expanded={showHelp}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-muted-foreground hover:text-white transition-colors py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              How to keep the video visible
              {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            
            {showHelp && (
              <div className="mt-2 p-3 bg-secondary/20 rounded-md border border-border/30 text-xs text-muted-foreground text-left leading-relaxed">
                Open the video on YouTube, enable Picture-in-Picture from your browser's video controls, then return here.
              </div>
            )}
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:border-0 ${isEmbedRestricted ? 'opacity-0 pointer-events-none' : ''}`} 
      />
    </div>
  );
}
