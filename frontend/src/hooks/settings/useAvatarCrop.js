// frontend/src/hooks/settings/useAvatarCrop.js
import { useState, useRef, useCallback, useEffect } from "react";

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
  const drawImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const img = imageRef.current;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // Clear with WHITE background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Calculate scale to cover
    const baseScale = Math.max(size / img.width, size / img.height);

    ctx.save();

    // Transform from center
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(baseScale * zoom, baseScale * zoom);
    ctx.translate(position.x, position.y);

    // Draw image from center
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // === CREATE CIRCULAR MASK - CORRECT WAY ===
    // Use globalCompositeOperation to create circular mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#000000"; // Color doesn't matter, only alpha
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";
  }, [zoom, rotation, position]);

  // Redraw when any parameter changes
  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY 
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get cropped image as data URL
  const getCroppedImage = () => {
    if (!canvasRef.current) return null;
    
    console.log('📸 Exporting cropped image...');
    
    try {
      // Export as JPEG with white background
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95);
      console.log('✅ Export successful, size:', dataUrl.length);
      
      return dataUrl;
    } catch (error) {
      console.error('❌ Export failed:', error);
      return null;
    }
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