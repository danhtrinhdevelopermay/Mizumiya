import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

interface YouTubeVideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
  autoPlay?: boolean;
}

export function YouTubeVideoPlayer({ 
  videoId, 
  title,
  className = '',
  autoPlay = true
}: YouTubeVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // YouTube embed URL với tất cả controls và branding disabled
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0&showinfo=0&fs=0&cc_load_policy=0&iv_load_policy=3&disablekb=1&playsinline=1&start=0&end=0${autoPlay ? '&autoplay=1' : ''}`;

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Gửi message đến iframe để control video
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        isPlaying ? '{"event":"command","func":"pauseVideo","args":""}' : '{"event":"command","func":"playVideo","args":""}',
        '*'
      );
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        isMuted ? '{"event":"command","func":"unMute","args":""}' : '{"event":"command","func":"mute","args":""}',
        '*'
      );
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"setVolume","args":"${newVolume}"}`,
        '*'
      );
    }
  };

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (!isFullscreen) {
        iframeRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const skipForward = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":"${currentTime + 10}"}`,
        '*'
      );
    }
  };

  const skipBackward = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":"${Math.max(0, currentTime - 10)}"}`,
        '*'
      );
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-testid="youtube-custom-player"
    >
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        data-testid="youtube-iframe"
      />
      
      {/* Overlay che phủ hoàn toàn YouTube branding và controls */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Che logo YouTube ở góc phải dưới */}
        <div className="absolute bottom-0 right-0 w-24 h-8 bg-black" />
        
        {/* Che title overlay của YouTube ở góc trái trên */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        
        {/* Che channel logo ở góc trái trên */}
        <div className="absolute top-2 left-2 w-16 h-16 bg-black rounded-full" />
        
        {/* Che các nút controls phía dưới của YouTube */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Che watermark và info ở góc phải */}
        <div className="absolute top-2 right-2 w-20 h-8 bg-black rounded" />
      </div>
      
      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: showControls || !isPlaying ? 'auto' : 'none' }}
      >
        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={togglePlay}
            variant="ghost"
            size="lg"
            className={`w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all ${
              isPlaying && showControls ? 'opacity-0' : 'opacity-100'
            }`}
            data-testid="button-play-pause-center"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs font-mono min-w-[40px]">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              data-testid="slider-progress"
            />
            <span className="text-white text-xs font-mono min-w-[40px]">
              {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              {/* Skip Controls */}
              <Button
                onClick={skipBackward}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                data-testid="button-skip-backward"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={skipForward}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                data-testid="button-skip-forward"
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  data-testid="button-mute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={5}
                    onValueChange={handleVolumeChange}
                    className="w-full"
                    data-testid="slider-volume"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Fullscreen */}
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                data-testid="button-fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ẩn video title overlay */}
      </div>
    </div>
  );
}