import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoFormat {
  itag: number;
  quality: string;
  url: string;
  mimeType: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface CustomVideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
  autoPlay?: boolean;
}

export function CustomVideoPlayer({ 
  videoId, 
  title,
  className = '',
  autoPlay = true
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qualityOptions, setQualityOptions] = useState<VideoFormat[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [useCanvasFallback, setUseCanvasFallback] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [lastCurrentTime, setLastCurrentTime] = useState(0);
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const animationRef = useRef<number>();
  const bufferCheckRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch video stream URL
  useEffect(() => {
    const fetchVideoStream = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`🎬 Fetching stream for video: ${videoId}`);
        
        const response = await fetch(`/api/youtube/stream/${videoId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video stream: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.bestQuality) {
          // Use direct proxy endpoint as video source
          const proxyUrl = `/api/youtube/proxy/${videoId}`;
          setVideoUrl(proxyUrl);
          setQualityOptions(data.formats?.filter((f: VideoFormat) => f.hasVideo && f.hasAudio) || []);
          console.log(`✅ Using proxy URL for "${data.title}": ${proxyUrl}`);
          console.log(`📊 Video formats available:`, data.formats?.length || 0);
          console.log(`🎯 Best format:`, data.bestQuality);
        } else {
          throw new Error('No suitable video format found');
        }
        
      } catch (err) {
        console.error('❌ Failed to fetch video stream:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchVideoStream();
    }
  }, [videoId]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setLastCurrentTime(video.currentTime);
      setIsBuffering(false);
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => {
      console.log('⏳ Video is buffering');
      setIsBuffering(true);
    };
    const handleCanPlayThrough = () => {
      console.log('✅ Video can play through');
      setIsBuffering(false);
    };
    const handleStalled = () => {
      console.log('⚠️ Video stream stalled');
      setIsBuffering(true);
    };
    const handleVolumeChange = () => {
      setVolume(video.volume * 100);
      setIsMuted(video.muted);
    };
    const handleCanPlay = () => {
      console.log('✅ Video can play, duration:', video.duration);
      setIsLoading(false);
      if (autoPlay) {
        video.play().catch(err => console.error('Auto-play failed:', err));
      }
    };
    const handleLoadStart = () => {
      console.log('🎥 Video loading started');
      setIsLoading(true);
    };
    const handleError = (e: any) => {
      console.error('❌ Video error:', e);
      console.error('❌ Video element error details:', {
        src: video.src,
        networkState: video.networkState,
        readyState: video.readyState,
        error: video.error
      });
      setError('Không thể phát video. Vui lòng thử lại.');
      setIsLoading(false);
    };
    const handleLoadedData = () => {
      console.log('📊 Video data loaded', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        src: video.src,
        currentSrc: video.currentSrc
      });
      
      // Check if video has visual content
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('⚠️ Video has no visual dimensions - audio-only stream detected');
      } else {
        console.log(`✅ Video has visual content: ${video.videoWidth}x${video.videoHeight}`);
      }
    };
    


    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [videoUrl, autoPlay]);

  // Anti-freeze logic: restart video if it gets stuck
  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;

    const checkProgress = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      // If video should be playing but time hasn't changed for 3+ seconds
      if (!video.paused && video.currentTime === lastCurrentTime && video.currentTime > 0) {
        console.log('🔄 Video appears stuck, attempting to restart playback');
        
        // Try to restart playback
        const currentPos = video.currentTime;
        video.currentTime = currentPos + 0.1; // Jump forward slightly
        video.play().catch(err => {
          console.error('Failed to restart video:', err);
          // If that fails, try reloading the video source
          const src = video.src;
          video.src = '';
          video.src = src;
          video.currentTime = currentPos;
          video.play().catch(e => console.error('Complete restart failed:', e));
        });
      }
      
      setLastCurrentTime(video.currentTime);
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkProgress);
  }, [isPlaying, lastCurrentTime]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Keep controls visible while paused
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Keep controls visible while paused
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    try {
      console.log('🎮 Toggle play called, current state:', isPlaying);
      if (isPlaying) {
        await videoRef.current.pause();
        console.log('⏸️ Video paused');
      } else {
        await videoRef.current.play();
        console.log('▶️ Video playing');
      }
    } catch (error) {
      console.error('❌ Play/pause error:', error);
      setError('Không thể phát/tạm dừng video');
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMutedState = !videoRef.current.muted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    console.log('🔇 Mute toggled:', newMutedState);
  };

  const handleVolumeChange = (values: number[]) => {
    if (!videoRef.current) return;
    const newVolume = values[0] / 100;
    videoRef.current.volume = newVolume;
    setVolume(values[0]);
    console.log(`🔊 Volume changed to: ${values[0]}%`);
  };

  const handleSeek = (values: number[]) => {
    if (!videoRef.current) return;
    const seekTime = values[0];
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    console.log(`🎯 Seeked to: ${formatTime(seekTime)}`);
  };

  const handleQualityChange = async (newQuality: string) => {
    if (!videoRef.current || newQuality === selectedQuality) return;
    
    try {
      setIsLoading(true);
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = isPlaying;
      
      // Use proxy endpoint with quality parameter
      const newProxyUrl = `/api/youtube/proxy/${videoId}?quality=${newQuality}`;
      setVideoUrl(newProxyUrl);
      setSelectedQuality(newQuality);
      
      // Restore playback position and state
      videoRef.current.addEventListener('loadeddata', () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (wasPlaying) {
            videoRef.current.play().catch(console.error);
          }
        }
      }, { once: true });
      
      console.log(`🔄 Quality changed to: ${newQuality}`);
      
    } catch (err) {
      console.error('❌ Quality change failed:', err);
      setError('Không thể thay đổi chất lượng video');
    } finally {
      setIsLoading(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.currentTime = newTime;
    console.log(`⏭️ Skipped ${seconds}s to ${formatTime(newTime)}`);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      videoRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  if (isLoading) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang tải video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <p className="text-red-400 mb-2">Lỗi tải video</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-testid="custom-video-player"
      style={{
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        className="w-full h-full"
        autoPlay={false}
        playsInline
        preload="metadata"
        controls={true}
        muted={false}
        style={{ 
          height: '300px',
          backgroundColor: '#000',
          objectFit: 'contain',
          display: 'block',
          width: '100%'
        }}
        data-testid="video-element"
        onLoadStart={() => console.log('🎥 Video element load started')}
        onCanPlay={() => console.log('✅ Video element can play')}
        onLoadedData={() => console.log('📊 Video element data loaded')}
        onError={(e) => console.error('❌ Video element error:', e)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) {
            console.log('📋 Video metadata loaded:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              duration: video.duration,
              src: video.src,
              networkState: video.networkState,
              readyState: video.readyState
            });
            
            // Force a redraw if video dimensions are available
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('✅ Video has dimensions, starting playback');
              if (autoPlay && video.paused) {
                video.play().catch(err => console.log('Auto-play prevented:', err));
              }
            } else {
              console.warn('⚠️ Video has no visual dimensions - audio-only stream');
            }
          }
        }}
      />

    </div>
  );
}