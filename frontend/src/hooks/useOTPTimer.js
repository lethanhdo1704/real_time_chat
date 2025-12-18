// frontend/src/hooks/useOTPTimer.js
import { useState, useEffect } from "react";

export function useOTPTimer() {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = (seconds = 300) => {
    setTimer(seconds);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    timer,
    startTimer,
    formatTimer,
  };
}