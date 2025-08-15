import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onUploadComplete?: (mediaUrls: string[], publicIds: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: "images" | "videos" | "all";
  className?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function MediaUpload({ 
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = "all",
  className = ""
}: MediaUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAcceptedFileTypes = () => {
    switch (acceptedTypes) {
      case "images":
        return "image/jpeg,image/jpg,image/png,image/gif,image/webp";
      case "videos":
        return "video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm";
      default:
        return "image/*,video/*";
    }
  };

  const uploadMedia = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('media', file);
      });
      formData.append('postId', `temp_${Date.now()}`); // Temporary post ID

      const response = await fetch('/api/posts/upload-media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload media');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Media uploaded",
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });
      
      if (onUploadComplete) {
        onUploadComplete(data.mediaUrls, data.publicIds);
      }
      
      setSelectedFiles([]);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    fileArray.forEach(file => {
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        toast({
          title: "File limit reached",
          description: `Maximum ${maxFiles} files allowed.`,
          variant: "destructive",
        });
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (acceptedTypes === "images" && !isImage) {
        toast({
          title: "Invalid file type",
          description: "Only images are allowed.",
          variant: "destructive",
        });
        return;
      }
      
      if (acceptedTypes === "videos" && !isVideo) {
        toast({
          title: "Invalid file type",
          description: "Only videos are allowed.",
          variant: "destructive",
        });
        return;
      }

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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    const files = selectedFiles.map(sf => sf.file);
    uploadMedia.mutate(files);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {acceptedTypes === "images" && "Images only (JPEG, PNG, GIF, WebP)"}
              {acceptedTypes === "videos" && "Videos only (MP4, AVI, MOV, WebM)"}
              {acceptedTypes === "all" && "Images and videos (Max 50MB each)"}
            </p>
            <p className="text-xs text-gray-500">
              Maximum {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptedFileTypes()}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Preview Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Selected Files ({selectedFiles.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                  {uploadedFile.type === 'image' ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                </div>
                
                <p className="text-xs mt-1 truncate">{uploadedFile.file.name}</p>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              disabled={uploadMedia.isPending}
              className="flex-1"
            >
              {uploadMedia.isPending ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
            </Button>
            <Button
              onClick={() => {
                selectedFiles.forEach(sf => URL.revokeObjectURL(sf.preview));
                setSelectedFiles([]);
              }}
              variant="outline"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}