import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaUpload from "@/components/media/media-upload";
import StoryMediaUpload from "@/components/media/story-media-upload";
import ImageUploadModal from "@/components/profile/image-upload-modal";
import { Button } from "@/components/ui/button";
import { Image, Video, Camera, FileText } from "lucide-react";

export default function MediaTestPage() {
  const [isProfileUploadOpen, setIsProfileUploadOpen] = useState(false);
  const [isCoverUploadOpen, setIsCoverUploadOpen] = useState(false);
  const [uploadedPostMedia, setUploadedPostMedia] = useState<string[]>([]);
  const [uploadedStoryMedia, setUploadedStoryMedia] = useState<string | null>(null);
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video' | null>(null);

  const handlePostMediaUpload = (mediaUrls: string[], publicIds: string[]) => {
    setUploadedPostMedia(prev => [...prev, ...mediaUrls]);
    console.log('Post media uploaded:', { mediaUrls, publicIds });
  };

  const handleStoryMediaUpload = (mediaUrl: string, publicId: string, mediaType: 'image' | 'video') => {
    setUploadedStoryMedia(mediaUrl);
    setStoryMediaType(mediaType);
    console.log('Story media uploaded:', { mediaUrl, publicId, mediaType });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Cloudinary Media Upload Test</h1>
        <p className="text-gray-600">Test tính năng upload hình ảnh và video với Cloudinary</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Profile Images</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Post Media</span>
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>Story Media</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Images Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Profile & Cover Images</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsProfileUploadOpen(true)}
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                >
                  <Camera className="h-6 w-6" />
                  <span>Upload Profile Image</span>
                </Button>
                
                <Button
                  onClick={() => setIsCoverUploadOpen(true)}
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                >
                  <Image className="h-6 w-6" />
                  <span>Upload Cover Image</span>
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Tính năng:</strong> Upload và tối ưu hóa tự động hình ảnh profile và cover.
                Profile: 400x400px, Cover: 1200x400px
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post Media Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Post Media Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload
                onUploadComplete={handlePostMediaUpload}
                maxFiles={10}
                acceptedTypes="all"
              />
              
              <div className="mt-4 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                <strong>Tính năng:</strong> Upload nhiều file cùng lúc (tối đa 10). Hỗ trợ hình ảnh và video.
                Tự động tối ưu hóa chất lượng và kích thước.
              </div>
            </CardContent>
          </Card>

          {uploadedPostMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Post Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedPostMedia.map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={url}
                        alt={`Uploaded media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Story Media Tab */}
        <TabsContent value="stories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Story Media Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StoryMediaUpload
                onUploadComplete={handleStoryMediaUpload}
              />
              
              <div className="mt-4 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                <strong>Tính năng:</strong> Upload media cho Stories với tỷ lệ 9:16 (dọc).
                Tự động tối ưu hóa cho mobile và tạo preview.
              </div>
            </CardContent>
          </Card>

          {uploadedStoryMedia && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Story Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs mx-auto">
                  <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-100">
                    {storyMediaType === 'image' ? (
                      <img
                        src={uploadedStoryMedia}
                        alt="Uploaded story"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={uploadedStoryMedia}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        onError={(e) => {
                          console.warn('Media test video error:', e);
                        }}
                      />
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Story {storyMediaType} uploaded successfully
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modals */}
      <ImageUploadModal
        isOpen={isProfileUploadOpen}
        onClose={() => setIsProfileUploadOpen(false)}
        type="avatar"
      />
      
      <ImageUploadModal
        isOpen={isCoverUploadOpen}
        onClose={() => setIsCoverUploadOpen(false)}
        type="cover"
      />

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Cloudinary Integration Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">✅ Đã tích hợp:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Tự động tối ưu hóa hình ảnh</li>
                <li>• Hỗ trợ nhiều định dạng file</li>
                <li>• Upload đa file</li>
                <li>• Xóa file không cần thiết</li>
                <li>• Tự động resize và crop</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🚀 Lợi ích:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Tiết kiệm dung lượng database</li>
                <li>• Tốc độ tải nhanh hơn</li>
                <li>• CDN toàn cầu</li>
                <li>• Tối ưu hóa tự động</li>
                <li>• Backup và bảo mật</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}