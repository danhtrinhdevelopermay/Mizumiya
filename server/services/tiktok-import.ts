import { TikTokScraper, type TikTokVideo } from './tiktok-scraper';
import { storage } from '../storage';
import CloudinaryService from '../cloudinary';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface TikTokImportResult {
  success: boolean;
  message: string;
  accountCreated?: boolean;
  postCreated?: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  post?: {
    id: string;
    title: string;
    videoUrl: string;
  };
  error?: string;
}

export class TikTokImportService {
  private static instance: TikTokImportService;
  private scraper: TikTokScraper;
  private constructor() {
    this.scraper = TikTokScraper.getInstance();
  }

  public static getInstance(): TikTokImportService {
    if (!TikTokImportService.instance) {
      TikTokImportService.instance = new TikTokImportService();
    }
    return TikTokImportService.instance;
  }

  public async importVideoFromUrl(url: string): Promise<TikTokImportResult> {
    console.log(`🎬 Starting TikTok import for URL: ${url}`);
    
    try {
      // Step 1: Extract video data from TikTok URL
      console.log('📡 Extracting video data from TikTok...');
      const videoData = await this.scraper.extractVideoFromUrl(url);
      
      if (!videoData.user.username) {
        throw new Error('Could not extract TikTok user information');
      }

      // Step 2: Check if we already imported this video
      const existingImport = await storage.getTiktokImportByVideoId(videoData.id);
      if (existingImport) {
        return {
          success: false,
          message: `Video ${videoData.id} has already been imported`,
          error: 'Video already exists'
        };
      }

      // Step 3: Check if TikTok account already exists in our system
      let tiktokAccount = await storage.getTiktokAccountByUsername(videoData.user.username);
      let accountCreated = false;
      
      if (!tiktokAccount) {
        console.log(`👤 Creating new TikTok account for @${videoData.user.username}`);
        tiktokAccount = await this.createTikTokAccount(videoData);
        accountCreated = true;
      } else {
        console.log(`👤 Using existing TikTok account for @${videoData.user.username}`);
        // Update account data with latest info
        await storage.updateTiktokAccount(tiktokAccount.id, {
          displayName: videoData.user.displayName,
          avatar: videoData.user.avatar,
          verified: videoData.user.isVerified
        });
      }

      // Step 4: Create import record
      const importRecord = await storage.createTiktokImport({
        tiktokAccountId: tiktokAccount.id,
        tiktokVideoId: videoData.id,
        originalUrl: url,
        status: 'processing'
      });

      // Step 5: Download and upload video
      console.log('⬇️ Downloading and uploading video...');
      let videoUrl = '';
      try {
        videoUrl = await this.downloadAndUploadVideo(videoData);
      } catch (videoError) {
        console.error('Video download/upload failed:', videoError);
        await storage.updateTiktokImport(importRecord.id, {
          status: 'failed',
          errorMessage: `Video download failed: ${videoError instanceof Error ? videoError.message : 'Unknown error'}`
        });
        throw new Error('Failed to download and upload video');
      }

      // Step 6: Create user account if needed
      let appUser = null;
      if (tiktokAccount.appUserId) {
        appUser = await storage.getUserById(tiktokAccount.appUserId);
      }
      
      if (!appUser) {
        console.log(`🆕 Creating app user account for @${videoData.user.username}`);
        appUser = await this.createAppUser(videoData, tiktokAccount.id);
        
        if (!appUser) {
          throw new Error('Failed to create app user account');
        }
        
        await storage.linkTiktokAccountToUser(tiktokAccount.id, appUser.id);
      }

      // Ensure appUser exists before proceeding
      if (!appUser || !appUser.id) {
        throw new Error('User account not available for post creation');
      }

      // Step 7: Create post
      console.log('📝 Creating post...');
      const post = await storage.createPost({
        userId: appUser.id,
        content: videoData.caption || `Video by @${videoData.user.username}`,
        type: 'video',
        title: this.generateVideoTitle(videoData),
        description: videoData.caption,
        images: [videoUrl],
        hashtags: this.extractHashtags(videoData.caption),
        category: 'tiktok-import',
        visibility: 'public'
      });

      // Step 8: Update import record as completed
      await storage.updateTiktokImport(importRecord.id, {
        status: 'completed',
        postId: post.id
      });

      console.log(`✅ TikTok import completed successfully!`);
      
      return {
        success: true,
        message: `Successfully imported video from @${videoData.user.username}`,
        accountCreated,
        postCreated: true,
        user: {
          id: appUser.id,
          username: appUser.username,
          displayName: `${appUser.firstName} ${appUser.lastName}`.trim()
        },
        post: {
          id: post.id,
          title: post.title || '',
          videoUrl
        }
      };

    } catch (error) {
      console.error('❌ TikTok import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        message: `Failed to import TikTok video: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  private async createTikTokAccount(videoData: TikTokVideo) {
    return await storage.createTiktokAccount({
      tiktokUsername: videoData.user.username,
      tiktokUserId: videoData.user.id,
      displayName: videoData.user.displayName,
      avatar: videoData.user.avatar,
      verified: videoData.user.isVerified,
      signature: '', // TikTok bio not available from video data
      followerCount: 0,
      followingCount: 0,
      likesCount: 0,
      videoCount: 0
    });
  }

  private async createAppUser(videoData: TikTokVideo, tiktokAccountId: string) {
    // Generate unique username and email
    const baseUsername = videoData.user.username || `tiktok_${crypto.randomBytes(4).toString('hex')}`;
    let username = baseUsername;
    let counter = 1;
    
    // Ensure username is unique
    while (await storage.getUserByUsername(username)) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    const email = `${username}@tiktok-import.local`;
    const password = crypto.randomBytes(16).toString('hex'); // Random password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await storage.createUser({
      username,
      email,
      password: hashedPassword,
      firstName: videoData.user.displayName || videoData.user.username,
      lastName: '',
      dateOfBirth: null,
      profileImage: videoData.user.avatar,
      bio: `TikTok creator @${videoData.user.username}`
    });
  }

  private async downloadAndUploadVideo(videoData: TikTokVideo): Promise<string> {
    if (!videoData.videoUrl) {
      throw new Error('No video URL available');
    }

    console.log('⬇️ Downloading video from TikTok...');
    
    // Download video
    const response = await fetch(videoData.videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }
    
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`📦 Downloaded video: ${videoBuffer.length} bytes`);
    
    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const filename = `tiktok_${videoData.user.username}_${videoData.id}`;
    const uploadResult = await CloudinaryService.uploadPostMedia(
      videoBuffer,
      'tiktok-import',
      `tiktok_${videoData.id}`,
      'video'
    );
    
    console.log(`✅ Video uploaded: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  }

  private generateVideoTitle(videoData: TikTokVideo): string {
    if (videoData.caption && videoData.caption.length > 10) {
      // Use first part of caption as title
      const title = videoData.caption.split('\n')[0].substring(0, 60);
      return title.length < videoData.caption.length ? `${title}...` : title;
    }
    
    return `Video by @${videoData.user.username}`;
  }

  private extractHashtags(caption: string): string[] {
    if (!caption) return [];
    
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = caption.match(hashtagRegex) || [];
    
    return hashtags.map(tag => tag.substring(1)); // Remove # symbol
  }
}

export const tiktokImportService = TikTokImportService.getInstance();