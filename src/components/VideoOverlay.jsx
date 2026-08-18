import React, { useEffect, useRef, useState } from 'react';

export function VideoOverlay({ onCardShowTrigger }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const WORK_W = 1280;
    const WORK_H = 720;
    
    const KEY_R = 120, KEY_G = 254, KEY_B = 155;
    const THRESHOLD = 45;
    const SOFTNESS = 35;

    let last = 0;
    const off = document.createElement('canvas');
    off.width = WORK_W;
    off.height = WORK_H;
    const octx = off.getContext('2d', { willReadFrequently: true });

    canvas.width = WORK_W;
    canvas.height = WORK_H;

    let animationFrameId;

    const process = (now) => {
      animationFrameId = requestAnimationFrame(process);
      if (now - last < 40) return;
      last = now;

      if (video.readyState < 2) return;

      try {
        octx.drawImage(video, 0, 0, WORK_W, WORK_H);
        const data = octx.getImageData(0, 0, WORK_W, WORK_H);
        const d = data.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];

          const dr = r - KEY_R, dg = g - KEY_G, db = b - KEY_B;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          let alpha = (dist - THRESHOLD) / SOFTNESS;
          alpha = alpha < 0 ? 0 : (alpha > 1 ? 1 : alpha);

          if (alpha === 0) {
            d[i + 3] = 0;
          } else {
            if (alpha < 1) {
              d[i + 3] = (alpha * 255) | 0;
              if (g > r && g > b) {
                d[i + 1] = r > b ? r : b;
              }
            } else if (g > r && g > b) {
              d[i + 1] = r > b ? r : b;
            }
          }
        }

        octx.putImageData(data, 0, 0);
        ctx.clearRect(0, 0, WORK_W, WORK_H);
        ctx.drawImage(off, 0, 0);
      } catch (e) {}
    };

    const handleLoadedData = () => {
      animationFrameId = requestAnimationFrame(process);
    };

    const handleEnded = () => {
      setOpacity(0);
    };

    let shown = false;
    const handleTimeUpdate = () => {
      if (!shown && video.currentTime >= 2) {
        shown = true;
        if (onCardShowTrigger) onCardShowTrigger();
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
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
