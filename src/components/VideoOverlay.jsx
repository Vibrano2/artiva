import React, { useEffect, useRef, useState } from 'react';

export function VideoOverlay({ onCardShowTrigger }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show card immediately without any blocking delay
    if (onCardShowTrigger) {
      onCardShowTrigger();
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const WORK_W = 640;
    const WORK_H = 360;
    
    canvas.width = WORK_W;
    canvas.height = WORK_H;

    let animationFrameId;
    let last = 0;

    const process = (now) => {
      animationFrameId = requestAnimationFrame(process);
      if (now - last < 60) return; // Cap at ~16fps to prevent CPU bottlenecks
      last = now;

      if (video.readyState < 2 || video.paused || video.ended) return;

      try {
        ctx.drawImage(video, 0, 0, WORK_W, WORK_H);
      } catch {}
    };

    const handleLoadedData = () => {
      animationFrameId = requestAnimationFrame(process);
    };

    const handleEnded = () => {
      setOpacity(0);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onCardShowTrigger]);

  return (
    <>
      <video 
        ref={videoRef} 
        src="/v1.mp4" 
        muted 
        autoPlay 
        playsInline
        preload="metadata"
        className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
      />
      
      <canvas 
        ref={canvasRef}
        style={{ opacity }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] object-cover object-bottom pointer-events-none z-10 transition-opacity duration-800 ease-out"
      />
    </>
  );
}
