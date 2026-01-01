import { useEffect } from "react";

export function useEmojiStyle() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .emoji {
        display: inline-block;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
