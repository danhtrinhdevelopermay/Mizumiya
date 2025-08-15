import React, { useState } from 'react';

interface InlineVideoPlayerProps {
  src: string;
  className?: string;
  postId: string;
  mediaIndex: number;
}

export function InlineVideoPlayer({
  src,
  className,
  postId,
  mediaIndex
}: InlineVideoPlayerProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPlayer(true);
  };

  if (showPlayer) {
    return (
      <div className="relative">
        <video 
          src={src}
          className={className}
          controls
          autoPlay
          muted={false}
          data-testid={`video-player-${postId}-${mediaIndex}`}
          onEnded={() => setShowPlayer(false)}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video thumbnail */}
      <video 
        src={src}
        className={className}
        preload="metadata"
        muted
        data-testid={`video-thumbnail-${postId}-${mediaIndex}`}
      />
      {/* Play button overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg cursor-pointer hover:bg-opacity-40 transition-all"
        onClick={handlePlayClick}
      >
        <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all transform hover:scale-105">
          <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}