import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, User, Calendar, MapPin, Heart, Briefcase, GraduationCap, Globe, Phone } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const profileSetupSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  workplace: z.string().optional(),
  education: z.string().optional(),
  relationshipStatus: z.enum(["single", "in_a_relationship", "engaged", "married", "its_complicated", "prefer_not_to_say"]).optional(),
});

type ProfileSetupData = z.infer<typeof profileSetupSchema>;

export default function SetupProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: "",
      dateOfBirth: "",
      gender: undefined,
      phoneNumber: "",
      location: "",
      website: "",
      workplace: "",
      education: "",
      relationshipStatus: undefined,
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileSetupData) => {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          profileImage,
          coverImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể cập nhật thông tin");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      // Update user data in cache with the updated profile
      if (data.user) {
        queryClient.setQueryData(["/api/users/me"], data.user);
      }
      await queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
      
      toast({
        title: "Thành công!",
        description: "Thông tin cá nhân đã được cập nhật.",
      });
      
      // Wait a bit for state to update, then navigate to home
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to home page after profile setup
      const isOnRender = window.location.hostname.includes('onrender.com');
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('replit.dev') ||
                           window.location.hostname.includes('5000');
      
      if (isOnRender || !isDevelopment) {
        window.location.replace("/?_t=" + Date.now());
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSkip = () => {
    // Navigate to home page when skipping profile setup
    const isOnRender = window.location.hostname.includes('onrender.com');
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('replit.dev') ||
                         window.location.hostname.includes('5000');
    
    if (isOnRender || !isDevelopment) {
      window.location.replace("/?_t=" + Date.now());
    } else {
      setLocation("/");
    }
  };

  const onSubmit = (data: ProfileSetupData) => {
    updateProfile.mutate(data);
  };

  const handleImageUpload = (type: 'profile' | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (type === 'profile') {
          setProfileImage(imageUrl);
        } else {
          setCoverImage(imageUrl);
        }
      };
      reader.readAsDataURL(file);

      // Upload to server
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type === 'profile' ? 'avatar' : 'cover');

        const response = await fetch('/api/users/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Update with uploaded URL
        if (type === 'profile') {
          setProfileImage(data.imageUrl);
        } else {
          setCoverImage(data.imageUrl);
        }

        toast({
          title: "Thành công!",
          description: `${type === 'profile' ? 'Ảnh đại diện' : 'Ảnh bìa'} đã được tải lên.`,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải ảnh lên. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-600">Hoàn thiện hồ sơ cá nhân</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Thêm thông tin để bạn bè dễ dàng tìm thấy và kết nối với bạn
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile & Cover Images */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Ảnh đại diện và ảnh bìa</h3>
                
                {/* Cover Image */}
                <div className="relative h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-4 overflow-hidden">
                  {coverImage && (
                    <img src={coverImage} alt="Ảnh bìa" className="w-full h-full object-cover" />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleImageUpload('cover')}
                    data-testid="button-upload-cover"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Ảnh bìa
                  </Button>
                  {coverImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-20"
                      onClick={() => setCoverImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Profile Image */}
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800">
                    {profileImage ? (
                      <img src={profileImage} alt="Ảnh đại diện" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => handleImageUpload('profile')}
                    data-testid="button-upload-profile"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tên của bạn" data-testid="input-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Họ của bạn" data-testid="input-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiểu sử</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Viết vài dòng về bản thân..."
                          className="resize-none"
                          rows={3}
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Ngày sinh
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-dateOfBirth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới tính</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="female">Nữ</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                            <SelectItem value="prefer_not_to_say">Không muốn nói</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0123456789" data-testid="input-phoneNumber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Nơi ở hiện tại
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Thành phố, Quốc gia" data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Professional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workplace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Nơi làm việc
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Công ty, tổ chức" data-testid="input-workplace" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Học vấn
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Trường, chuyên ngành" data-testid="input-education" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="relationshipStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Tình trạng hôn nhân
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-relationshipStatus">
                            <SelectValue placeholder="Chọn tình trạng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Độc thân</SelectItem>
                          <SelectItem value="in_a_relationship">Đang hẹn hò</SelectItem>
                          <SelectItem value="engaged">Đã đính hôn</SelectItem>
                          <SelectItem value="married">Đã kết hôn</SelectItem>
                          <SelectItem value="its_complicated">Phức tạp</SelectItem>
                          <SelectItem value="prefer_not_to_say">Không muốn nói</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSkip}
                    data-testid="button-skip"
                  >
                    Bỏ qua
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={updateProfile.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfile.isPending ? "Đang lưu..." : "Hoàn thành"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}