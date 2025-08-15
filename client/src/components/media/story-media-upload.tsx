import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StoryMediaUploadProps {
  onUploadComplete?: (mediaUrl: string, publicId: string, mediaType: 'image' | 'video') => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function StoryMediaUpload({ 
  onUploadComplete,
  className = ""
}: StoryMediaUploadProps) {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadStoryMedia = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('storyId', `story_${Date.now()}`); // Temporary story ID

      const response = await fetch('/api/stories/upload-media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload story media');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Story media uploaded",
        description: "Your story media has been uploaded successfully.",
      });
      
      if (onUploadComplete) {
        onUploadComplete(data.mediaUrl, data.publicId, data.mediaType);
      }
      
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload story media. Please try again.",
        variant: "destructive",
      });
      console.error('Story upload error:', error);
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Only images and videos are allowed for stories.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setSelectedFile({
      file,
      preview,
      type: isImage ? 'image' : 'video'
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
      setSelectedFile(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadStoryMedia.mutate(selectedFile.file);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-3">
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <p className="text-lg font-medium">
              Upload Story Media
            </p>
            <p className="text-sm text-gray-500">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Images and videos (Max 50MB)
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Preview Selected File */}
      {selectedFile && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Selected File</h4>
          <div className="relative max-w-sm mx-auto">
            <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-100">
              {selectedFile.type === 'image' ? (
                <img
                  src={selectedFile.preview}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={selectedFile.preview}
                  className="w-full h-full object-cover"
                  controls
                  muted
                  onError={(e) => {
                    console.warn('Story video preview error:', e);
                  }}
                />
              )}
            </div>
            
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
              {selectedFile.type === 'image' ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
              <span>{selectedFile.type}</span>
            </div>
            
            <p className="text-sm mt-2 text-center text-gray-600 truncate">
              {selectedFile.file.name}
            </p>
            <p className="text-xs text-center text-gray-500">
              {(selectedFile.file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>

          <div className="flex space-x-2 max-w-sm mx-auto">
            <Button
              onClick={handleUpload}
              disabled={uploadStoryMedia.isPending}
              className="flex-1"
            >
              {uploadStoryMedia.isPending ? 'Uploading...' : 'Upload to Story'}
            </Button>
            <Button
              onClick={removeFile}
              variant="outline"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}