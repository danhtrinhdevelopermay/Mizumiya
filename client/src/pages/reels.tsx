import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, BookmarkPlus, Music, MoreHorizontal, Play, Pause, RefreshCw, Search, X } from 'lucide-react';
import Layout from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TikTokVideo {
  id: string;
  videoUrl: string;
  webmUrl?: string;
  thumbnail: string;
  caption: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  music: {
    title: string;
    artist: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdTime: number;
}

interface Reel extends TikTokVideo {
  isLiked: boolean;
}


export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchQuery, setSearchQuery] = useState('viral');
  const [searchInput, setSearchInput] = useState('viral');
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const { toast } = useToast();

  // Fetch TikTok videos using search
  const { data: tiktokData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/tiktok/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/tiktok/search?q=${encodeURIComponent(searchQuery)}&limit=15&type=keyword`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(errorData.message || 'Failed to fetch TikTok videos');
        (error as any).status = response.status;
        (error as any).errorData = errorData;
        throw error;
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry for service unavailable errors
      if ((error as any)?.status === 503) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Convert TikTok videos to reels format and add isLiked property
  useEffect(() => {
    if (tiktokData?.videos) {
      const convertedReels: Reel[] = tiktokData.videos.map((video: TikTokVideo) => ({
        ...video,
        isLiked: Math.random() > 0.8 // Random liked state
      }));
      setReels(convertedReels);
    }
  }, [tiktokData]);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const refreshVideos = () => {
    refetch();
    toast({
      title: "Đang tải video mới",
      description: `Đang tìm kiếm video về "${searchQuery}"...`,
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query.trim());
      setSearchInput(query.trim());
      toast({
        title: "Đang tìm kiếm",
        description: `Đang tìm video TikTok về "${query.trim()}"...`,
      });
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearchInput(term);
    handleSearch(term);
    setShowSearch(false);
  };

  const quickSearchTerms = [
    'funny', 'dance', 'food', 'travel', 'music',
    'pets', 'comedy', 'art', 'fitness', 'beauty'
  ];

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
    const currentVideo = videoRefs.current[reels[currentIndex]?.id];
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
      
      // Pause all videos except the current one (only for direct video elements)
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (id === reels[newIndex]?.id && !reels[newIndex]?.videoUrl.includes('tiktok.com')) {
          video.play();
          setIsPlaying(true);
        } else if (!reels[newIndex]?.videoUrl.includes('tiktok.com')) {
          video.pause();
        }
      });
    }
  };

  useEffect(() => {
    // Auto-play the first video when reels are loaded (only for direct video elements)
    if (reels.length > 0 && !reels[0]?.videoUrl.includes('tiktok.com')) {
      const firstVideo = videoRefs.current[reels[0].id];
      if (firstVideo) {
        firstVideo.play();
      }
    }
  }, [reels]);

  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-xl">Đang tải video TikTok...</p>
            <p className="text-sm opacity-70 mt-2">Vui lòng đợi một chút</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || reels.length === 0) {
    const errorData = (error as any)?.errorData;
    const isServiceUnavailable = (error as any)?.status === 503;
    
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center bg-black">
          <div className="text-center text-white max-w-lg px-4">
            <div className="text-6xl mb-4">{isServiceUnavailable ? '🚫' : '😔'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {isServiceUnavailable ? 'Dịch vụ TikTok tạm thời không khả dụng' : 'Không thể tải video'}
            </h2>
            <p className="text-gray-300 mb-4">
              {isServiceUnavailable 
                ? (errorData?.message || 'Hệ thống không thể kết nối đến TikTok để lấy video thực. Điều này có thể do TikTok đã chặn truy cập hoặc hệ thống đang gặp sự cố.')
                : (error ? 'Có lỗi xảy ra khi tải video TikTok' : 'Không tìm thấy video nào')
              }
            </p>
            {errorData?.suggestion && (
              <p className="text-yellow-400 text-sm mb-6">
                💡 {errorData.suggestion}
              </p>
            )}
            <div className="space-y-3">
              <Button 
                onClick={refreshVideos}
                className="bg-pink-600 hover:bg-pink-700 text-white w-full"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Đang tải...' : 'Thử lại'}
              </Button>
              {isServiceUnavailable && (
                <Button
                  onClick={() => {
                    const newSearchTerms = ['trending', 'viral', 'funny', 'dance', 'music'];
                    const randomTerm = newSearchTerms[Math.floor(Math.random() * newSearchTerms.length)];
                    handleSearch(randomTerm);
                  }}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 w-full"
                >
                  Thử từ khóa khác
                </Button>
              )}
            </div>
            <div className="mt-6 text-xs text-gray-400 border-t border-gray-700 pt-4 space-y-2">
              <div>
                <p className="mb-1 text-yellow-400">🚨 Vấn đề kỹ thuật:</p>
                <p className="mb-2">Việc scraping video TikTok trực tiếp gặp khó khăn do:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>TikTok có hệ thống chống bot mạnh</li>
                  <li>Cần nhiều thư viện hệ thống</li>
                  <li>Có thể vi phạm điều khoản dịch vụ</li>
                  <li>Môi trường hiện tại không hỗ trợ Chrome</li>
                </ul>
              </div>
              <div>
                <p className="mb-1 text-green-400">💡 Giải pháp thực tế:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Sử dụng TikTok API chính thức</li>
                  <li>Tích hợp third-party APIs (TikAPI, RapidAPI)</li>
                  <li>Chia sẻ link TikTok trực tiếp</li>
                  <li>Sử dụng iframe embed cho video cụ thể</li>
                </ul>
              </div>
              <div className="bg-gray-800/50 p-3 rounded mt-3">
                <p className="text-white text-xs mb-1">ℹ️ Hệ thống đã loại bỏ hoàn toàn video giả</p>
                <p className="text-xs">Chỉ hiển thị video thực hoặc thông báo lỗi rõ ràng</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen overflow-hidden bg-black relative">
        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm video TikTok..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchInput);
                        setShowSearch(false);
                      }
                    }}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={() => setShowSearch(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick Search Terms */}
              <div className="mb-4">
                <p className="text-white/70 text-sm mb-2">Tìm kiếm phổ biến:</p>
                <div className="flex flex-wrap gap-2">
                  {quickSearchTerms.map((term) => (
                    <Button
                      key={term}
                      onClick={() => handleQuickSearch(term)}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    >
                      #{term}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={() => {
                  handleSearch(searchInput);
                  setShowSearch(false);
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        )}
        
        {/* Search Button */}
        <div className="absolute top-4 left-4 z-40">
          <Button
            onClick={() => setShowSearch(true)}
            size="sm"
            className="bg-black/50 hover:bg-black/70 text-white border-0 h-10 px-3"
          >
            <Search className="w-4 h-4 mr-2" />
            "{searchQuery}"
          </Button>
        </div>
        
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
              {/* Video - Using TikTok Embed or fallback video */}
              {reel.videoUrl.includes('tiktok.com') ? (
                <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                  {/* TikTok Embed */}
                  <iframe
                    src={`https://www.tiktok.com/embed/v2/${reel.id}?lang=en-US`}
                    className="w-full h-full border-0"
                    allow="encrypted-media;"
                    allowFullScreen
                  />
                  {/* Fallback image if embed fails */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${reel.thumbnail})` }}
                  />
                </div>
              ) : (
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
              )}
              
              {/* Play/Pause Button Overlay - Only show for direct video elements */}
              {!isPlaying && index === currentIndex && !reel.videoUrl.includes('tiktok.com') && (
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

              {/* Progress Indicator & Refresh Button */}
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <Button
                  onClick={refreshVideos}
                  size="sm"
                  className="bg-black/30 hover:bg-black/50 text-white border-0 h-8 w-8 p-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <div className="text-white text-xs bg-black/30 px-2 py-1 rounded-full">
                  {index + 1} / {reels.length}
                </div>
              </div>

              {/* Video Source Info */}
              <div className="absolute top-16 left-4 text-white text-xs bg-black/30 px-2 py-1 rounded-full">
                📱 Tìm kiếm: {searchQuery}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}