import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Upload file buffer to Cloudinary
   */
  static async uploadFile(
    buffer: Buffer,
    options: {
      folder?: string;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
      transformation?: any;
      public_id?: string;
    } = {}
  ): Promise<UploadResult> {
    const {
      folder = 'faceconnect',
      resource_type = 'auto',
      transformation,
      public_id
    } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type,
          transformation,
          public_id,
          overwrite: true,
          invalidate: true,
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width || 0,
              height: result.height || 0,
              format: result.format || '',
              resource_type: result.resource_type || 'image',
              bytes: result.bytes || 0
            });
          } else {
            reject(new Error('Upload failed - no result returned'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload profile image with optimizations
   */
  static async uploadProfileImage(
    buffer: Buffer,
    userId: string,
    type: 'avatar' | 'cover'
  ): Promise<UploadResult> {
    const transformation = type === 'avatar' 
      ? {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 80
        }
      : {
          width: 1200,
          height: 400,
          crop: 'fill',
          quality: 80
        };

    return this.uploadFile(buffer, {
      folder: `faceconnect/users/${userId}`,
      resource_type: 'image',
      transformation,
      public_id: `${type}_${Date.now()}`
    });
  }

  /**
   * Upload post media (images/videos)
   */
  static async uploadPostMedia(
    buffer: Buffer,
    userId: string,
    postId: string,
    mediaType: 'image' | 'video'
  ): Promise<UploadResult> {
    const transformation = mediaType === 'image' 
      ? {
          width: 1200,
          crop: 'limit',
          quality: 85
        }
      : {
          width: 1280,
          height: 720,
          crop: 'limit',
          quality: 'auto'
        };

    return this.uploadFile(buffer, {
      folder: `faceconnect/posts/${userId}`,
      resource_type: mediaType,
      transformation,
      public_id: `${postId}_${Date.now()}`
    });
  }

  /**
   * Upload story media
   */
  static async uploadStoryMedia(
    buffer: Buffer,
    userId: string,
    storyId: string,
    mediaType: 'image' | 'video'
  ): Promise<UploadResult> {
    const transformation = mediaType === 'image' 
      ? {
          width: 720,
          height: 1280,
          crop: 'fill',
          quality: 80
        }
      : {
          width: 720,
          height: 1280,
          crop: 'fill',
          quality: 'auto'
        };

    return this.uploadFile(buffer, {
      folder: `faceconnect/stories/${userId}`,
      resource_type: mediaType,
      transformation,
      public_id: `${storyId}_${Date.now()}`
    });
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate optimized URL with transformations
   */
  static generateUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      ...options,
      secure: true
    });
  }
}

export default CloudinaryService;