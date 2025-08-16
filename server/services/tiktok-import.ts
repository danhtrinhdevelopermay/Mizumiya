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
      
      // Validate extracted video data
      if (!videoData || !videoData.user || !videoData.user.username) {
        throw new Error('Could not extract TikTok user information');
      }
      
      if (!videoData.id) {
        throw new Error('Could not extract TikTok video ID');
      }
      
      console.log(`📹 Extracted video data for @${videoData.user.username} - ID: ${videoData.id}`);

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
        
        if (!tiktokAccount || !tiktokAccount.id) {
          throw new Error('Failed to create TikTok account');
        }
        
        accountCreated = true;
      } else {
        console.log(`👤 Using existing TikTok account for @${videoData.user.username}`);
        // Update account data with latest info
        if (tiktokAccount.id) {
          await storage.updateTiktokAccount(tiktokAccount.id, {
            displayName: videoData.user.displayName || '',
            avatar: videoData.user.avatar || '',
            verified: videoData.user.isVerified || false
          });
        }
      }

      // Step 4: Create import record
      if (!tiktokAccount || !tiktokAccount.id) {
        throw new Error('TikTok account not available for import record creation');
      }
      
      const importRecord = await storage.createTiktokImport({
        tiktokAccountId: tiktokAccount.id,
        tiktokVideoId: videoData.id,
        originalUrl: url,
        status: 'processing'
      });
      
      if (!importRecord || !importRecord.id) {
        throw new Error('Failed to create import record');
      }

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
        try {
          appUser = await storage.getUserById(tiktokAccount.appUserId);
        } catch (error) {
          console.log(`⚠️ Could not find existing user, will create new one`);
          appUser = null;
        }
      }
      
      if (!appUser) {
        console.log(`🆕 Creating app user account for @${videoData.user.username}`);
        appUser = await this.createAppUser(videoData, tiktokAccount.id);
        
        if (!appUser || !appUser.id) {
          throw new Error('Failed to create app user account');
        }
        
        await storage.linkTiktokAccountToUser(tiktokAccount.id, appUser.id);
      }

      // Final validation of appUser
      if (!appUser || !appUser.id) {
        throw new Error('User account not available for post creation');
      }
      
      console.log(`✅ User account ready: ${appUser.username} (${appUser.id})`);

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
    if (!videoData || !videoData.user || !videoData.user.username) {
      throw new Error('Invalid video data for TikTok account creation');
    }
    
    return await storage.createTiktokAccount({
      tiktokUsername: videoData.user.username,
      tiktokUserId: videoData.user.id || '',
      displayName: videoData.user.displayName || videoData.user.username,
      avatar: videoData.user.avatar || '',
      verified: videoData.user.isVerified || false,
      signature: '', // TikTok bio not available from video data
      followerCount: 0,
      followingCount: 0,
      likesCount: 0,
      videoCount: 0
    });
  }

  private async createAppUser(videoData: TikTokVideo, tiktokAccountId: string) {
    if (!videoData || !videoData.user || !videoData.user.username) {
      throw new Error('Invalid video data for app user creation');
    }
    
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
    
    try {
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName: videoData.user.displayName || videoData.user.username || 'TikTok User',
        lastName: '',
        dateOfBirth: null,
        profileImage: videoData.user.avatar || undefined,
        bio: `TikTok creator @${videoData.user.username}`
      });
      
      if (!user || !user.id) {
        throw new Error('Failed to create user - no user data returned');
      }
      
      return user;
    } catch (error) {
      console.error('Error creating app user:', error);
      throw new Error(`Failed to create app user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async downloadAndUploadVideo(videoData: TikTokVideo): Promise<string> {
    if (!videoData || !videoData.videoUrl) {
      throw new Error('No video URL available');
    }
    
    if (!videoData.user || !videoData.user.username) {
      throw new Error('No user information available for video filename');
    }
    
    if (!videoData.id) {
      throw new Error('No video ID available');
    }

    console.log('⬇️ Downloading video from TikTok...');
    
    try {
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
      
      if (!videoBuffer || videoBuffer.length === 0) {
        throw new Error('Downloaded video is empty');
      }
      
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
      
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('Failed to upload video to Cloudinary - no URL returned');
      }
      
      console.log(`✅ Video uploaded: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;
    } catch (error) {
      console.error('Error in video download/upload:', error);
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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