import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  Music, 
  MapPin, 
  Tag, 
  Hash, 
  Image as ImageIcon, 
  Scissors, 
  Shield,
  MessageCircle,
  Download,
  X,
  Upload,
  Play,
  Pause
} from "lucide-react";

// Enhanced form schema for video posts
const videoPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc cho video"),
  content: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  videoLabels: z.array(z.string()).default([]),
  musicTrack: z.string().optional(),
  commentsEnabled: z.boolean().default(true),
  downloadEnabled: z.boolean().default(true),
  trimStart: z.number().default(0),
  trimEnd: z.number().optional(),
  type: z.string().default("video"),
  visibility: z.string().default("public"),
});

type VideoPostFormData = z.infer<typeof videoPostSchema>;

interface VideoPostFormProps {
  videoFile: File;
  onSubmit: (data: VideoPostFormData & { videoFile: File }) => void;
  onCancel: () => void;
}

const categories = [
  { value: "travel", label: "Du lịch" },
  { value: "food", label: "Ẩm thực" },
  { value: "lifestyle", label: "Lối sống" },
  { value: "entertainment", label: "Giải trí" },
  { value: "education", label: "Giáo dục" },
  { value: "sports", label: "Thể thao" },
  { value: "technology", label: "Công nghệ" },
  { value: "beauty", label: "Làm đẹp" },
  { value: "fashion", label: "Thời trang" },
  { value: "health", label: "Sức khỏe" },
  { value: "music", label: "Âm nhạc" },
  { value: "art", label: "Nghệ thuật" },
];

const videoLabels = [
  { value: "child_friendly", label: "Phù hợp với trẻ em" },
  { value: "educational", label: "Giáo dục" },
  { value: "sensitive_content", label: "Nội dung nhạy cảm" },
  { value: "copyright_music", label: "Nhạc có bản quyền" },
  { value: "promotional", label: "Quảng cáo" },
  { value: "mature_audience", label: "Dành cho người lớn" },
];

export default function VideoPostForm({ videoFile, onSubmit, onCancel }: VideoPostFormProps) {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimPreview, setTrimPreview] = useState({ start: 0, end: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VideoPostFormData>({
    resolver: zodResolver(videoPostSchema),
    defaultValues: {
      title: "",
      content: "",
      description: "",
      location: "",
      category: "",
      hashtags: [],
      coverImage: "",
      videoLabels: [],
      musicTrack: "",
      commentsEnabled: true,
      downloadEnabled: true,
      trimStart: 0,
      trimEnd: undefined,
      type: "video",
      visibility: "public",
    },
  });

  // Generate video preview URL
  const videoPreviewUrl = videoFile ? URL.createObjectURL(videoFile) : "";

  const handleVideoLoad = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      setTrimPreview({ start: 0, end: duration });
      form.setValue("trimEnd", duration);
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      const newHashtags = [...hashtags, hashtagInput.trim()];
      setHashtags(newHashtags);
      form.setValue("hashtags", newHashtags);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    const newHashtags = hashtags.filter(tag => tag !== tagToRemove);
    setHashtags(newHashtags);
    form.setValue("hashtags", newHashtags);
  };

  const toggleLabel = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter(l => l !== label)
      : [...selectedLabels, label];
    setSelectedLabels(newLabels);
    form.setValue("videoLabels", newLabels);
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImagePreview(result);
        form.setValue("coverImage", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureCoverFromVideo = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setCoverImagePreview(dataURL);
        form.setValue("coverImage", dataURL);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmitForm = (data: VideoPostFormData) => {
    onSubmit({ ...data, videoFile });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Video className="h-6 w-6 mr-2 text-blue-500" />
          Tạo bài viết video
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview Section */}
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={videoPreviewUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={handleVideoLoad}
              muted
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePlayPause}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1 text-xs text-white">
                {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Cover Image Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh bìa</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={captureCoverFromVideo}
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Chụp từ video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Tải ảnh tùy chỉnh
              </Button>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="hidden"
            />
            {coverImagePreview && (
              <div className="relative">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setCoverImagePreview("");
                    form.setValue("coverImage", "");
                  }}
                  className="absolute top-2 right-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Video Trimming */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Scissors className="h-4 w-4 mr-2" />
              Cắt video
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Bắt đầu (giây)</label>
                <Input
                  type="number"
                  min="0"
                  max={videoDuration}
                  {...form.register("trimStart", { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Kết thúc (giây)</label>
                <Input
                  type="number"
                  min="0"
                  max={videoDuration}
                  {...form.register("trimEnd", { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
              {/* Title - Required */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-500">Tiêu đề *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập tiêu đề video của bạn" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Mô tả video của bạn, thêm hashtag và link..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Địa điểm
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Thêm địa điểm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Danh mục
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hashtags */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Hashtags
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    placeholder="Nhập hashtag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  />
                  <Button type="button" onClick={addHashtag} variant="outline">
                    Thêm
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center">
                        #{tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHashtag(tag)}
                          className="h-auto p-0 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Music Track */}
              <FormField
                control={form.control}
                name="musicTrack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Music className="h-4 w-4 mr-2" />
                      Nhạc nền
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tên bài hát hoặc link nhạc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Video Labels */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Gắn nhãn nội dung
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {videoLabels.map((label) => (
                    <div key={label.value} className="flex items-center space-x-2">
                      <Switch
                        checked={selectedLabels.includes(label.value)}
                        onCheckedChange={() => toggleLabel(label.value)}
                      />
                      <span className="text-sm">{label.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cài đặt video</h3>
                
                <FormField
                  control={form.control}
                  name="commentsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Cho phép bình luận
                      </FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="downloadEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Cho phép tải xuống
                      </FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quyền riêng tư</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Công khai</SelectItem>
                          <SelectItem value="friends">Chỉ bạn bè</SelectItem>
                          <SelectItem value="private">Riêng tư</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Đăng video
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Hủy
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}