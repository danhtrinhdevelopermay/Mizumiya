import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Play, Eye, ThumbsUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/layout';
import { CustomVideoPlayer } from '@/components/custom-video-player';

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
    channelId: string;
    channelThumbnail?: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export default function VideosPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: searchResults, isLoading } = useQuery<YouTubeSearchResponse>({
    queryKey: ['/api/youtube/search', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchQuery,
        maxResults: '12',
        order: 'relevance'
      });
      const response = await fetch(`/api/youtube/search?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search videos: ${errorText}`);
      }
      return response.json();
    },
    enabled: !!searchQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast({
        title: "Vui lòng nhập từ khóa",
        description: "Nhập từ khóa tìm kiếm video YouTube.",
        variant: "destructive",
      });
      return;
    }
    
    setSearchQuery(searchInput.trim());
  };

  const formatViewCount = (viewCount: string) => {
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const playVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Video YouTube
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tìm kiếm và xem video YouTube ngay trên ứng dụng
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            type="text"
            placeholder="Tìm kiếm video trên YouTube..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1"
            data-testid="input-youtube-search"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading || !searchInput.trim()}
            data-testid="button-search-youtube"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
          </Button>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Đang phát
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg overflow-hidden">
                <CustomVideoPlayer
                  videoId={selectedVideo.id.videoId}
                  title={selectedVideo.snippet.title}
                  className="w-full"
                  autoPlay={true}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-video-title">
                    {selectedVideo.snippet.title}
                  </h3>
                  
                  {/* Channel info với avatar */}
                  <div className="flex items-center gap-3 mb-3">
                    {selectedVideo.snippet.channelThumbnail ? (
                      <img
                        src={selectedVideo.snippet.channelThumbnail}
                        alt={`${selectedVideo.snippet.channelTitle} avatar`}
                        className="w-10 h-10 rounded-full object-cover"
                        data-testid="img-channel-avatar"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {selectedVideo.snippet.channelTitle.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100" data-testid="text-channel-name">
                        {selectedVideo.snippet.channelTitle}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span data-testid="text-publish-date">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(selectedVideo.snippet.publishedAt)}
                        </span>
                        {selectedVideo.statistics && (
                          <>
                            <span data-testid="text-view-count">
                              <Eye className="w-3 h-3 inline mr-1" />
                              {formatViewCount(selectedVideo.statistics.viewCount)} lượt xem
                            </span>
                            <span data-testid="text-like-count">
                              <ThumbsUp className="w-3 h-3 inline mr-1" />
                              {formatViewCount(selectedVideo.statistics.likeCount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3" data-testid="text-video-description">
                  {selectedVideo.snippet.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Kết quả tìm kiếm cho "{searchQuery}"
              </h2>
              {searchResults?.pageInfo && (
                <span className="text-sm text-gray-500">
                  {searchResults.pageInfo.resultsPerPage} video được tìm thấy
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults?.items?.length && searchResults.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.items.map((video: YouTubeVideo) => (
                  <Card 
                    key={video.id.videoId} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => playVideo(video)}
                    data-testid={`card-video-${video.id.videoId}`}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-thumbnail-${video.id.videoId}`}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2" data-testid={`text-title-${video.id.videoId}`}>
                        {video.snippet.title}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <p data-testid={`text-channel-${video.id.videoId}`}>{video.snippet.channelTitle}</p>
                        <div className="flex items-center gap-2">
                          {video.statistics && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              {formatViewCount(video.statistics.viewCount)}
                            </Badge>
                          )}
                          <span>{formatDate(video.snippet.publishedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery && !isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Không tìm thấy video nào cho "{searchQuery}"
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Welcome Message */}
        {!searchQuery && !selectedVideo && (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Play className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Khám phá video YouTube
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Tìm kiếm và xem hàng triệu video YouTube ngay trên ứng dụng. 
                Nhập từ khóa vào ô tìm kiếm để bắt đầu.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}