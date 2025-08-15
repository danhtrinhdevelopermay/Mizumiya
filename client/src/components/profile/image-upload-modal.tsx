import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "avatar" | "cover";
}

export default function ImageUploadModal({ isOpen, onClose, type }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch('/api/users/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Image updated",
        description: `Your ${type} photo has been updated successfully.`,
      });
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadImage.mutate(selectedFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-foreground">
            Update {type === "avatar" ? "Profile" : "Cover"} Picture
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Input */}
          <div className="mb-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={`mx-auto object-cover ${
                        type === "avatar" ? "w-32 h-32 rounded-full" : "w-full h-32 rounded-lg"
                      }`}
                    />
                    <p className="text-muted-foreground text-sm">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Upload a photo</p>
                      <p className="text-muted-foreground text-sm">
                        Choose a file or drag and drop it here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploadImage.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadImage.isPending}
              className="bg-primary hover:bg-primary"
            >
              {uploadImage.isPending ? "Uploading..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}