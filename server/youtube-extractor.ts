import ytdl from '@distube/ytdl-core';

export interface VideoFormat {
  itag: number;
  quality: string;
  url: string;
  mimeType: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  filesize?: number;
}

export interface VideoStreamData {
  title: string;
  duration: number;
  formats: VideoFormat[];
  bestQuality?: VideoFormat;
  audioOnly?: VideoFormat;
}

export class YouTubeExtractor {
  private static instance: YouTubeExtractor;

  static getInstance(): YouTubeExtractor {
    if (!YouTubeExtractor.instance) {
      YouTubeExtractor.instance = new YouTubeExtractor();
    }
    return YouTubeExtractor.instance;
  }

  /**
   * Lấy stream URLs trực tiếp từ YouTube video ID
   */
  async getVideoStreams(videoId: string): Promise<VideoStreamData> {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`🎥 Extracting streams for video: ${videoId}`);

      // Lấy thông tin video từ YouTube với options cải tiến
      const info = await ytdl.getInfo(videoUrl, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      });
      
      // Lọc và format thông tin stream, ưu tiên các format tương thích với HTML5
      const formats: VideoFormat[] = info.formats
        .filter(format => {
          // Chỉ lấy formats có URL hợp lệ, có cả video và audio, và tương thích với trình duyệt
          const isValidFormat = format.url && 
                               !format.isLive && 
                               format.hasVideo && 
                               format.hasAudio;
          
          // Ưu tiên các container tương thích với HTML5
          const isHTML5Compatible = format.container === 'mp4' || 
                                   format.container === 'webm' ||
                                   (format.mimeType && format.mimeType.includes('mp4'));
          
          return isValidFormat && isHTML5Compatible;
        })
        .map(format => ({
          itag: format.itag,
          quality: format.qualityLabel || format.quality || 'unknown',
          url: format.url,
          mimeType: format.mimeType || 'unknown',
          container: format.container || 'unknown',
          hasVideo: format.hasVideo || false,
          hasAudio: format.hasAudio || false,
          filesize: format.contentLength ? parseInt(format.contentLength) : undefined
        }))
        // Remove duplicates based on itag
        .filter((format, index, self) => 
          index === self.findIndex(f => f.itag === format.itag)
        )
        .sort((a, b) => {
          // Sắp xếp theo chất lượng: ưu tiên MP4, sau đó theo chất lượng
          const aIsMP4 = a.container === 'mp4';
          const bIsMP4 = b.container === 'mp4';
          
          if (aIsMP4 && !bIsMP4) return -1;
          if (bIsMP4 && !aIsMP4) return 1;
          
          // Cả hai cùng format, sắp xếp theo itag (chất lượng)
          return b.itag - a.itag;
        });

      // Nếu không có format nào phù hợp, thử lấy adaptive streams
      if (formats.length === 0) {
        console.log('⚠️ No combined formats found, trying adaptive streams...');
        const adaptiveFormats = info.formats
          .filter(format => format.url && format.hasVideo && !format.hasAudio)
          .slice(0, 5) // Chỉ lấy 5 format đầu
          .map(format => ({
            itag: format.itag,
            quality: format.qualityLabel || format.quality || 'unknown',
            url: format.url,
            mimeType: format.mimeType || 'unknown',
            container: format.container || 'unknown',
            hasVideo: format.hasVideo || false,
            hasAudio: format.hasAudio || false,
            filesize: format.contentLength ? parseInt(format.contentLength) : undefined
          }));
        
        formats.push(...adaptiveFormats);
      }

      // Tìm format tốt nhất với codec tương thích HTML5
      const bestQuality = formats.find(f => 
        f.hasVideo && f.hasAudio && f.container === 'mp4' && 
        f.mimeType.includes('avc1') // H.264 codec
      ) || formats.find(f => 
        f.hasVideo && f.hasAudio && f.container === 'mp4'
      ) || formats.find(f => 
        f.hasVideo && f.hasAudio && f.mimeType.includes('mp4')
      ) || formats.find(f => 
        f.hasVideo && f.hasAudio
      ) || formats[0];
      
      // Tìm audio chất lượng cao nhất
      const audioOnly = info.formats
        .filter(f => !f.hasVideo && f.hasAudio && f.url)
        .sort((a, b) => b.itag - a.itag)[0];

      const audioOnlyFormat = audioOnly ? {
        itag: audioOnly.itag,
        quality: audioOnly.qualityLabel || audioOnly.quality || 'audio',
        url: audioOnly.url!,
        mimeType: audioOnly.mimeType || 'unknown',
        container: audioOnly.container || 'unknown',
        hasVideo: false,
        hasAudio: true,
        filesize: audioOnly.contentLength ? parseInt(audioOnly.contentLength) : undefined
      } : undefined;

      const result: VideoStreamData = {
        title: info.videoDetails.title,
        duration: parseInt(info.videoDetails.lengthSeconds),
        formats,
        bestQuality,
        audioOnly: audioOnlyFormat
      };

      console.log(`✅ Extracted ${formats.length} formats for "${result.title}"`);
      console.log(`🎯 Best quality: ${bestQuality?.quality} (${bestQuality?.mimeType})`);
      console.log(`📋 Available formats:`, formats.map(f => `${f.quality} (${f.container}) - ${f.mimeType}`).slice(0, 5));
      
      return result;

    } catch (error) {
      console.error(`❌ YouTube extraction failed for ${videoId}:`, error);
      throw new Error(`Failed to extract video streams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lấy format tốt nhất cho video (có cả video và audio)
   */
  async getBestVideoFormat(videoId: string): Promise<VideoFormat> {
    const streams = await this.getVideoStreams(videoId);
    
    if (!streams.bestQuality) {
      throw new Error('No suitable video format found');
    }
    
    return streams.bestQuality;
  }

  /**
   * Lấy các format khác nhau cho lựa chọn chất lượng
   */
  async getQualityOptions(videoId: string): Promise<VideoFormat[]> {
    const streams = await this.getVideoStreams(videoId);
    
    // Lọc các format có cả video và audio, loại bỏ trùng lặp chất lượng
    const qualityMap = new Map<string, VideoFormat>();
    
    streams.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .forEach(format => {
        const key = format.quality;
        if (!qualityMap.has(key) || format.itag > qualityMap.get(key)!.itag) {
          qualityMap.set(key, format);
        }
      });
    
    return Array.from(qualityMap.values())
      .sort((a, b) => {
        // Sắp xếp theo thứ tự chất lượng
        const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
        const aIndex = qualityOrder.indexOf(a.quality);
        const bIndex = qualityOrder.indexOf(b.quality);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
  }
}

export const youtubeExtractor = YouTubeExtractor.getInstance();