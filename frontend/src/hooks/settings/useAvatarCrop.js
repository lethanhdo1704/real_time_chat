// frontend/src/hooks/settings/useAvatarCrop.js
import { useState, useRef, useEffect } from "react";

/**
 * Custom hook for avatar cropping functionality
 * Handles canvas drawing, zoom, rotation, and dragging
 */
export function useAvatarCrop(originalImage) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Draw image on canvas with transformations
  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Apply transformations
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-size / 2 + position.x, -size / 2 + position.y);

    // Draw image centered
    const scale = Math.max(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.restore();

    // Draw circular crop overlay
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  // Redraw when any parameter changes
  useEffect(() => {
    drawImage();
  }, [zoom, rotation, position, originalImage]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get cropped image as data URL
  const getCroppedImage = () => {
    if (!canvasRef.current) return null;
    return canvasRef.current.toDataURL("image/jpeg", 0.9);
  };

  return {
    canvasRef,
    imageRef,
    zoom,
    rotation,
    position,
    setZoom,
    setRotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawImage,
    getCroppedImage,
  };
}