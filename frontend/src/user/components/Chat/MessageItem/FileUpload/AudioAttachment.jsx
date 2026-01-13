// frontend/src/user/components/Chat/MessageItem/FileUpload/AudioAttachment.jsx

import { Music, Download, Play, Pause } from 'lucide-react';
import { uploadService } from '../../../../services/uploadService';
import { truncateFilename } from '../../../../utils/fileUtils';
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from 'react';

/**
 * AudioAttachment Component - BEAUTIFUL ORANGE GRADIENT
 * 
 * Features:
 * - Beautiful orange gradient background (orange-500 → #F97316)
 * - Custom audio player with large seekbar
 * - Easy to scrub/seek through audio
 * - Download functionality
 */
export default function AudioAttachment({ attachment, isMe }) {
  const { url, name, size, mime } = attachment;
  const { t } = useTranslation("chat");
  
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 max-w-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Music className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" title={name}>
              {truncateFilename(name, 35)}
            </p>
            <p className="text-xs text-white/80">
              {uploadService.formatFileSize(size)}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-110"
            title={t("file.download")}
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Custom Audio Player */}
        <div className="space-y-3">
          {/* Play/Pause Button + Progress Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white fill-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              )}
            </button>

            {/* Seekbar - Large and easy to use */}
            <div className="flex-1 space-y-1">
              <div
                className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleSeek}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
              >
                {/* Progress */}
                <div
                  className="absolute h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                
                {/* Thumb - appears on hover */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: '-8px' }}
                />
              </div>

              {/* Time display */}
              <div className="flex justify-between text-xs text-white/90">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata">
          <source src={url} type={mime} />
        </audio>
      </div>
    </div>
  );
}