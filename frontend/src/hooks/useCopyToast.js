// frontend/src/hooks/useCopyToast.js
import { useState, useCallback } from "react";

export function useCopyToast(duration = 2000) {
  const [showToast, setShowToast] = useState(false);

  const triggerToast = useCallback(() => {
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, duration);
  }, [duration]);

  const hideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  return {
    showToast,
    triggerToast,
    hideToast,
  };
}
