import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, BookmarkPlus, Music, MoreHorizontal, Play, Pause } from 'lucide-react';
import Layout from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Reel {
  id: string;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
  };
  music: {
    title: string;
    artist: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
}

// Sample reel data - in a real app, this would come from an API
const SAMPLE_REELS: Reel[] = [
  {
    id: '1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/400/600?random=1',
    caption: 'Beautiful sunset vibes! 🌅 What do you think about this amazing view? #sunset #nature #beautiful',
    user: {
      id: 'user1',
      username: 'naturelover',
      displayName: 'Nature Lover',
      avatar: 'https://picsum.photos/100/100?random=1',
      isVerified: true,
    },
    music: {
      title: 'Chill Vibes',
      artist: 'Relaxing Music',
    },
    stats: {
      likes: 15200,
      comments: 234,
      shares: 45,
    },
    isLiked: false,
  },
  {
    id: '2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://picsum.photos/400/600?random=2',
    caption: 'Dancing through the night! 💃✨ #dance #fun #nightlife',
    user: {
      id: 'user2',
      username: 'dancequeen',
      displayName: 'Dance Queen',
      avatar: 'https://picsum.photos/100/100?random=2',
    },
    music: {
      title: 'Upbeat Dance',
      artist: 'Party Mix',
    },
    stats: {
      likes: 8900,
      comments: 156,
      shares: 67,
    },
    isLiked: true,
  },
  {
    id: '3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://picsum.photos/400/600?random=3',
    caption: 'Cooking tips that will change your life! 👨‍🍳🔥 #cooking #tips #food',
    user: {
      id: 'user3',
      username: 'chefpro',
      displayName: 'Chef Pro',
      avatar: 'https://picsum.photos/100/100?random=3',
      isVerified: true,
    },
    music: {
      title: 'Kitchen Beats',
      artist: 'Cooking Sounds',
    },
    stats: {
      likes: 23400,
      comments: 445,
      shares: 123,
    },
    isLiked: false,
  },
];

export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reels, setReels] = useState(SAMPLE_REELS);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const toggleLike = (reelId: string) => {
    setReels(prevReels =>
      prevReels.map(reel =>
        reel.id === reelId
          ? {
              ...reel,
              isLiked: !reel.isLiked,
              stats: {
                ...reel.stats,
                likes: reel.isLiked
                  ? reel.stats.likes - 1
                  : reel.stats.likes + 1,
              },
            }
          : reel
      )
    );
  };

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[reels[currentIndex].id];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
      
      // Pause all videos except the current one
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (id === reels[newIndex].id) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
        }
      });
    }
  };

  useEffect(() => {
    // Auto-play the first video when component mounts
    const firstVideo = videoRefs.current[reels[0].id];
    if (firstVideo) {
      firstVideo.play();
    }
  }, []);

  return (
    <Layout>
      <div className="h-screen overflow-hidden bg-black">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className="relative h-screen snap-start flex items-center justify-center"
            >
              {/* Video */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current[reel.id] = el;
                }}
                className="absolute inset-0 w-full h-full object-cover"
                src={reel.videoUrl}
                loop
                muted
                playsInline
                poster={reel.thumbnail}
                onClick={togglePlayPause}
              />
              
              {/* Play/Pause Button Overlay */}
              {!isPlaying && index === currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-20 h-20 rounded-full bg-black/30 hover:bg-black/50 text-white"
                    onClick={togglePlayPause}
                  >
                    <Play className="w-8 h-8" />
                  </Button>
                </div>
              )}

              {/* Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
                <div className="flex items-end justify-between">
                  {/* Left Side - User Info & Caption */}
                  <div className="flex-1 mr-4">
                    {/* User Info */}
                    <div className="flex items-center mb-3">
                      <Avatar className="w-12 h-12 border-2 border-white">
                        <AvatarImage src={reel.user.avatar} alt={reel.user.username} />
                        <AvatarFallback>
                          {reel.user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-semibold text-lg">
                            @{reel.user.username}
                          </span>
                          {reel.user.isVerified && (
                            <div className="ml-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 text-xs px-3 py-1 h-6 bg-transparent border-white text-white hover:bg-white hover:text-black"
                        >
                          Follow
                        </Button>
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-sm leading-relaxed mb-3 max-w-xs">
                      {reel.caption}
                    </p>

                    {/* Music Info */}
                    <div className="flex items-center text-xs opacity-80">
                      <Music className="w-3 h-3 mr-1" />
                      <span className="truncate">
                        {reel.music.title} - {reel.music.artist}
                      </span>
                    </div>
                  </div>

                  {/* Right Side - Action Buttons */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Like Button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white p-0"
                        onClick={() => toggleLike(reel.id)}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            reel.isLiked ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </Button>
                      <span className="text-xs mt-1 font-medium">
                        {formatCount(reel.stats.likes)}
                      </span>
                    </div>

                    {/* Comment Button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white p-0"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </Button>
                      <span className="text-xs mt-1 font-medium">
                        {formatCount(reel.stats.comments)}
                      </span>
                    </div>

                    {/* Share Button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white p-0"
                      >
                        <Share className="w-6 h-6" />
                      </Button>
                      <span className="text-xs mt-1 font-medium">
                        {formatCount(reel.stats.shares)}
                      </span>
                    </div>

                    {/* Save Button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white p-0"
                      >
                        <BookmarkPlus className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* More Options */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white p-0"
                      >
                        <MoreHorizontal className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Profile Avatar (Spinning Music Disc) */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-r from-pink-500 to-purple-500 animate-spin flex items-center justify-center" style={{animationDuration: '8s'}}>
                        <Music className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="absolute top-4 right-4 text-white text-xs bg-black/30 px-2 py-1 rounded-full">
                {index + 1} / {reels.length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}