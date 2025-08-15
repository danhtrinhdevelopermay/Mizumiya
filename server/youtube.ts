interface YouTubeSearchParams {
  q: string;
  maxResults?: number;
  order?: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title';
  type?: 'video' | 'channel' | 'playlist';
  pageToken?: string;
}

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
    dislikeCount: string;
    commentCount: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
      dislikeCount: string;
      commentCount: string;
    };
  }>;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeSearchResponse> {
    const {
      q,
      maxResults = 12,
      order = 'relevance',
      type = 'video',
      pageToken
    } = params;

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q,
      type,
      order,
      maxResults: maxResults.toString(),
      key: this.apiKey,
      regionCode: 'VN', // Vietnam region code
      relevanceLanguage: 'vi', // Vietnamese language preference
    });

    if (pageToken) {
      searchParams.append('pageToken', pageToken);
    }

    const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data: YouTubeSearchResponse = await response.json();

    // Get video statistics and channel details for each video
    if (data.items.length > 0) {
      const videoIds = data.items
        .filter(item => item.id.videoId)
        .map(item => item.id.videoId)
        .join(',');

      const channelIds = [...new Set(data.items.map(item => item.snippet.channelId))].join(',');

      if (videoIds) {
        try {
          // Get video statistics
          const statistics = await this.getVideoStatistics(videoIds);
          
          // Get channel details including thumbnails
          const channels = await this.getChannelDetails(channelIds);
          
          // Merge statistics and channel data with search results
          data.items.forEach(item => {
            if (item.id.videoId && statistics[item.id.videoId]) {
              item.statistics = statistics[item.id.videoId];
            }
            if (item.snippet.channelId && channels[item.snippet.channelId]) {
              item.snippet.channelThumbnail = channels[item.snippet.channelId].thumbnail;
            }
          });
        } catch (error) {
          console.warn('Failed to fetch video statistics or channel details:', error);
        }
      }
    }

    return data;
  }

  async getVideoStatistics(videoIds: string): Promise<Record<string, any>> {
    const searchParams = new URLSearchParams({
      part: 'statistics',
      id: videoIds,
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/videos?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data: YouTubeVideoDetailsResponse = await response.json();
    
    // Convert array to object for easy lookup
    const statisticsMap: Record<string, any> = {};
    data.items.forEach(item => {
      statisticsMap[item.id] = item.statistics;
    });

    return statisticsMap;
  }

  async getChannelDetails(channelIds: string): Promise<Record<string, any>> {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      id: channelIds,
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/channels?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Convert array to object for easy lookup
    const channelsMap: Record<string, any> = {};
    data.items.forEach((item: any) => {
      channelsMap[item.id] = {
        thumbnail: item.snippet.thumbnails?.default?.url || 
                  item.snippet.thumbnails?.medium?.url ||
                  item.snippet.thumbnails?.high?.url
      };
    });

    return channelsMap;
  }

  async getVideoDetails(videoId: string) {
    const searchParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoId,
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/videos?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items[0] || null;
  }

  async getTrendingVideos(regionCode = 'VN', maxResults = 24): Promise<YouTubeSearchResponse> {
    const searchParams = new URLSearchParams({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode,
      maxResults: maxResults.toString(),
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/videos?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Convert to search response format
    return {
      items: data.items.map((item: any) => ({
        id: { videoId: item.id },
        snippet: item.snippet,
        statistics: item.statistics,
      })),
      pageInfo: {
        totalResults: data.pageInfo.totalResults,
        resultsPerPage: data.pageInfo.resultsPerPage,
      },
    };
  }
}

export const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY || '');