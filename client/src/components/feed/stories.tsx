import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import type { User, StoryWithUser } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgress } from "@/components/ui/upload-progress";
import { useToast } from "@/hooks/use-toast";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import { queryClient } from "@/lib/queryClient";

export default function Stories() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [storyContent, setStoryContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'success' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: stories = [] } = useQuery<StoryWithUser[]>({
    queryKey: ["/api/stories"],
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: { content: string; file: File }) => {
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadMessage("Đang tải lên story...");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            setUploadStatus('processing');
            setUploadMessage("Đang xử lý story...");
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      try {
        const formData = new FormData();
        formData.append("content", data.content);
        formData.append("media", data.file);

        const response = await fetch("/api/stories", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          setUploadStatus('error');
          setUploadMessage("Lỗi tạo story");
          throw new Error("Failed to create story");
        }

        setUploadProgress(100);
        setUploadStatus('success');
        setUploadMessage("Story đã được tạo thành công!");

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadStatus('error');
        setUploadMessage("Lỗi tạo story");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setTimeout(() => {
        resetForm();
        toast({
          title: "Story created!",
          description: "Your story has been shared successfully.",
        });
      }, 1500);
    },
    onError: () => {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('uploading');
        setUploadMessage("");
        toast({
          title: "Error",
          description: "Failed to create story. Please try again.",
          variant: "destructive",
        });
      }, 1500);
    },
  });

  const resetForm = () => {
    setStoryContent("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsCreateDialogOpen(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadMessage("");
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Only images and videos are allowed for stories.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No media selected",
        description: "Please select an image or video for your story.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    createStoryMutation.mutate({ content: storyContent, file: selectedFile });
  };

  return (
    <>
      <div className="p-3 lg:p-4 mb-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Kawaii Create Story Card */}
          <div className="flex-shrink-0 w-28 lg:w-32">
            <div 
              className="relative border-2 border-pink-200 rounded-3xl h-48 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              data-testid="button-create-story"
              onClick={() => setIsCreateDialogOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #fce7f3 50%, #fdf2f8 100%)'
              }}
            >
              {/* Kawaii Decorative Elements */}
              <div className="absolute top-2 right-2 text-pink-400 text-lg animate-pulse">💕</div>
              <div className="absolute bottom-2 left-2 text-yellow-400 text-sm animate-bounce">✨</div>
              <div className="absolute top-3 left-3 text-pink-300 text-xs">💫</div>
              
              {/* User Avatar with Kawaii Ring */}
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 p-1.5 shadow-md">
                    <img 
                      src={user?.profileImage || "/default-avatar.jpg"} 
                      alt="Create story" 
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                  {/* Heart decoration */}
                  <div className="absolute -top-1 -right-1 text-pink-500 text-xs animate-pulse">💖</div>
                </div>
              </div>
              
              {/* Kawaii Plus Button */}
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 hover:from-blue-500 hover:to-blue-600">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {/* Kawaii Text */}
              <div className="text-center">
                <p className="text-xs font-bold text-pink-500 tracking-wide">Tạo tin</p>
                <div className="text-yellow-400 text-xs">✨</div>
              </div>
            </div>
          </div>

          {/* Kawaii Existing Stories */}
          {stories.map((story) => {
            // Determine gender-based color scheme
            const isFemaleName = /[aă][iy]$|[ie]n$|[ua]ng$|[ui]nh$|uy$|oan$|[aă]n$/i.test(story.user.firstName || '');
            const gradientStyle = isFemaleName 
              ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fef7ff 100%)'  // Pink for female
              : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #e0f2fe 100%)';  // Blue for male
            const borderColor = isFemaleName ? 'border-pink-200' : 'border-blue-200';
            
            return (
              <div key={story.id} className="flex-shrink-0 w-28 lg:w-32">
                <div 
                  className={`relative ${borderColor} border-2 rounded-3xl h-48 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl p-3`}
                  data-testid={`story-${story.id}`}
                  onClick={() => setLocation(`/story/${story.id}`)}
                  style={{
                    background: gradientStyle
                  }}
                >
              {/* Kawaii Decorative Elements */}
              <div className="absolute top-2 right-2 text-pink-400 text-lg animate-pulse">💕</div>
              <div className="absolute bottom-3 right-3 text-yellow-400 text-sm animate-bounce">⭐</div>
              <div className="absolute top-4 left-2 text-green-400 text-xs rotate-12">🌿</div>
              <div className="absolute bottom-5 left-2 text-yellow-300 text-xs">✨</div>
              
              {/* User Avatar with Kawaii Ring */}
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 p-1.5 shadow-md">
                    <img 
                      src={story.user.profileImage || "/default-avatar.jpg"} 
                      alt={story.user.firstName} 
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Kawaii Story Title */}
              <div className="text-center px-1">
                <p className="text-xs font-bold text-gray-700 mb-1 leading-tight">
                  {story.user.firstName}'s story
                </p>
                <p className="text-[10px] text-gray-600 font-medium">
                  <UserNameWithBadge 
                    firstName={story.user.firstName}
                    lastName=""
                    badgeImageUrl={story.user.badgeImageUrl}
                    showFullName={false}
                  />
                </p>
              </div>
              </div>
            </div>
          );
        })}

          {/* Kawaii No Stories Message */}
          {stories.length === 0 && (
            <div className="flex-shrink-0 w-36 lg:w-40">
              <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
                <div className="text-4xl mb-2 animate-bounce">🌸</div>
                <p className="text-sm text-pink-400 font-medium">Chưa có story nào</p>
                <p className="text-xs text-gray-400 mt-1">Hãy tạo story đầu tiên! ✨</p>
              </div>
            </div>
          )}
      </div>
    </div>

    {/* Create Story Dialog */}
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tin</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File upload area */}
          {!selectedFile ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Thêm ảnh hoặc video</p>
              <p className="text-xs text-muted-foreground mt-1">Kích thước tối đa: 50MB</p>
            </div>
          ) : (
            <div className="relative">
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={previewUrl!} 
                  alt="Story preview" 
                  className="w-full h-60 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={previewUrl!} 
                  className="w-full h-60 object-cover rounded-lg" 
                  controls
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          )}

          {/* Story content */}
          <Textarea
            placeholder="Write something about your story..."
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            className="min-h-[100px]"
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="my-4">
              <UploadProgress
                progress={uploadProgress}
                status={uploadStatus}
                fileName={selectedFile?.name}
                message={uploadMessage}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isUploading || createStoryMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary"
              onClick={handleSubmit}
              disabled={isUploading || createStoryMutation.isPending}
            >
              {isUploading || createStoryMutation.isPending ? "Đang tạo..." : "Chia sẻ Story"}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  </>
  );
}
