import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Image, Smile, Globe, Users, Lock, X, Upload, Video, Play } from "lucide-react";
import VideoPostForm from "./video-post-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadProgress } from "@/components/ui/upload-progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function CreatePost() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [postContent, setPostContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'success' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      resetForm();
      toast({
        title: "Đăng bài thành công!",
        description: "Bài viết của bạn đã được chia sẻ thành công.",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo bài viết. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPostContent("");
    setVisibility("public");
    setSelectedFiles([]);
    setSelectedVideoFile(null);
    setShowVideoForm(false);
    setIsDialogOpen(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadMessage("");
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideoFile(file);
      setShowVideoForm(true);
      setIsDialogOpen(false); // Close main dialog and open video form
    }
  };

  const handleVideoPostSubmit = async (data: any) => {
    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadMessage("Đang tải video lên...");

      // Upload video file first
      const formData = new FormData();
      formData.append('file', data.videoFile);
      formData.append('type', 'video');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      
      // Create enhanced post with video features
      const postData = {
        content: data.content || "",
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        hashtags: data.hashtags,
        coverImage: data.coverImage,
        videoLabels: data.videoLabels,
        musicTrack: data.musicTrack,
        commentsEnabled: data.commentsEnabled,
        downloadEnabled: data.downloadEnabled,
        trimStart: data.trimStart,
        trimEnd: data.trimEnd,
        type: data.type,
        visibility: data.visibility,
        mediaUrls: [uploadResult.url],
      };

      await createPostMutation.mutateAsync(postData);
      setShowVideoForm(false);
      resetForm();
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: "Lỗi tải video",
        description: "Không thể tải video lên. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    fileArray.forEach(file => {
      if (selectedFiles.length + newFiles.length >= 10) {
        toast({
          title: "File limit reached",
          description: "Maximum 10 files allowed per post.",
          variant: "destructive",
        });
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid file type",
          description: "Only images and videos are allowed.",
          variant: "destructive",
        });
        return;
      }

      const preview = URL.createObjectURL(file);
      newFiles.push({
        file,
        preview,
        type: isImage ? 'image' : 'video'
      });
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadMessage(`Đang tải lên ${selectedFiles.length} file...`);

    try {
      const formData = new FormData();
      selectedFiles.forEach(sf => {
        formData.append('media', sf.file);
      });
      formData.append('postId', `temp_${Date.now()}`);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            setUploadStatus('processing');
            setUploadMessage("Đang xử lý media...");
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await fetch('/api/posts/upload-media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        setUploadStatus('error');
        setUploadMessage("Lỗi tải lên media");
        throw new Error('Failed to upload media');
      }

      setUploadProgress(100);
      setUploadStatus('success');
      setUploadMessage("Tải lên thành công!");

      const result = await response.json();
      return result.mediaUrls || [];
    } catch (error) {
      console.error('Media upload error:', error);
      setUploadStatus('error');
      setUploadMessage("Lỗi tải lên media");
      throw error;
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('uploading');
        setUploadMessage("");
      }, 1500);
    }
  };

  const handleSubmit = async () => {
    if (!postContent.trim() && selectedFiles.length === 0) {
      toast({
        title: "Bài viết trống",
        description: "Vui lòng thêm nội dung hoặc phương tiện vào bài viết của bạn.",
        variant: "destructive",
      });
      return;
    }

    try {
      let mediaUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        mediaUrls = await uploadMedia();
      }

      const postType = selectedFiles.length > 0 ? "media" : "text";

      createPostMutation.mutate({
        content: postContent,
        mediaUrls,
        type: postType,
        visibility,
      });
    } catch (error) {
      toast({
        title: "Tải lên thất bại",
        description: "Không thể tải lên phương tiện. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Simple Facebook-style Create Post - giống hệt trong hình */}
      <div className="bg-white rounded-xl shadow-lg mb-4 p-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <img 
            src={user?.profileImage || "/default-avatar.jpg"} 
            alt="Your profile" 
            className="w-10 h-10 rounded-full object-cover bg-gray-300"
          />
          
          {/* Input field */}
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex-1 px-4 py-3 text-left text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            data-testid="button-open-post-modal"
          >
            Bạn đang nghĩ gì?
          </button>
          
          {/* Photo icon */}
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
            data-testid="button-photo-video"
          >
            <Image className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg kawaii-card border-2 border-kawaii-pink-300">
          <DialogHeader>
            <DialogTitle className="text-center border-b-2 border-kawaii-pink-200 pb-4 text-kawaii-purple-700 font-kawaii text-xl">
              ✨ Tạo bài viết dễ thương ✨
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={user?.profileImage || "/default-avatar.jpg"} 
                  alt="Your profile" 
                  className="kawaii-avatar w-12 h-12"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-kawaii-pink-400 to-kawaii-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🌟</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-cute font-bold text-kawaii-purple-700 text-lg">
                  💖 {user?.firstName} {user?.lastName}
                </p>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-auto border-none shadow-none p-0 h-auto text-sm text-kawaii-purple-600 font-cute">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="kawaii-card border-kawaii-pink-300">
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2 text-kawaii-purple-700">
                        <Globe className="h-4 w-4 text-kawaii-blue-500" />
                        <span className="font-cute">🌍 Công khai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center space-x-2 text-kawaii-purple-700">
                        <Users className="h-4 w-4 text-kawaii-mint-500" />
                        <span className="font-cute">👥 Bạn bè</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2 text-kawaii-purple-700">
                        <Lock className="h-4 w-4 text-kawaii-peach-500" />
                        <span className="font-cute">🔒 Riêng tư</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              placeholder={`🌸 ${user?.firstName}, hãy chia sẻ những điều dễ thương nhé! 🌸`}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="kawaii-input min-h-[120px] text-lg font-cute text-kawaii-purple-700 placeholder:text-kawaii-purple-400"
              data-testid="textarea-post-content"
            />
            
            {/* Media Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Add to your post</span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-green-500 hover:text-green-600"
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              
              {/* Preview Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((uploadedFile, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {uploadedFile.type === 'image' ? (
                          <img
                            src={uploadedFile.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <div className="text-white text-center">
                              <Upload className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Video</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="my-4">
                <UploadProgress
                  progress={uploadProgress}
                  status={uploadStatus}
                  fileName={selectedFiles.length > 0 ? `${selectedFiles.length} files` : undefined}
                  message={uploadMessage}
                />
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={(!postContent.trim() && selectedFiles.length === 0) || createPostMutation.isPending || isUploading}
              className="w-full bg-primary hover:bg-primary text-white"
              data-testid="button-submit-post"
            >
              {isUploading ? "Đang tải lên..." : createPostMutation.isPending ? "Đang đăng..." : "Đăng bài"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Video Post Form */}
      {showVideoForm && selectedVideoFile && (
        <VideoPostForm
          videoFile={selectedVideoFile}
          onSubmit={handleVideoPostSubmit}
          onCancel={() => {
            setShowVideoForm(false);
            setSelectedVideoFile(null);
          }}
        />
      )}
    </>
  );
}
