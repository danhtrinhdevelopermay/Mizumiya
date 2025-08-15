import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpUser } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, User, Calendar } from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>("");

  const form = useForm<SignUpUser>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      gender: undefined,
      phoneNumber: undefined,
      bio: undefined,
      location: undefined,
      website: undefined,
      workplace: undefined,
      education: undefined,
      relationshipStatus: undefined,
      profileImage: undefined,
      coverImage: undefined,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: SignUpUser) => {
    console.log("Form submitted with data:", data);
    
    try {
      setError("");
      console.log("Calling signUp mutation...");
      
      const result = await signUp.mutateAsync(data);
      console.log("SignUp successful:", result);
      
      // Show success notification
      toast({
        title: "Thành công!",
        description: "Tài khoản đã được tạo và bạn đã đăng nhập.",
      });
      
      // Set user data in cache immediately
      queryClient.setQueryData(["/api/users/me"], result.user);
      
      // Determine environment
      const isOnRender = window.location.hostname.includes('onrender.com');
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('replit.dev') ||
                           window.location.hostname.includes('5000');
      
      console.log("Environment detection:", { isOnRender, isDevelopment });
      
      // Special handling for production environment
      if (isOnRender || !isDevelopment) {
        console.log("🔥 Production/Render environment: implementing comprehensive signup redirect");
        
        // Step 1: Mark successful signup and set target
        sessionStorage.setItem('signupSuccess', 'true');
        sessionStorage.setItem('signupTime', Date.now().toString());
        sessionStorage.setItem('redirectTo', 'setup-profile');
        
        // Step 2: Immediately set user data in cache
        queryClient.setQueryData(["/api/users/me"], result.user);
        
        // Step 3: Wait for state persistence
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 4: Use location.href for guaranteed navigation
        window.location.href = "/setup-profile?authenticated=true&_t=" + Date.now();
      } else {
        console.log("Development environment: using client-side navigation to setup-profile");
        await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        await new Promise(resolve => setTimeout(resolve, 500));
        setLocation("/setup-profile");
      }
      
    } catch (err: any) {
      console.error("SignUp error:", err);
      let message = "Không thể tạo tài khoản. Vui lòng thử lại.";
      
      if (err.message?.includes("already exists") || err.message?.includes("duplicate") || err.message?.includes("email")) {
        message = "Email hoặc username đã được sử dụng. Vui lòng thử thông tin khác.";
      }
      
      setError(message);
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Elements */}
      {/* Top decorative elements */}
      <div className="absolute top-6 left-20">
        <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
          <span className="text-lg">🥩</span>
        </div>
      </div>
      
      <div className="absolute top-16 right-20">
        <div className="w-10 h-10 bg-green-300 rounded-full flex items-center justify-center">
          <span className="text-sm">🍓</span>
        </div>
      </div>

      {/* Side decorative flowers/leaves */}
      <div className="absolute left-6 top-1/4">
        <div className="w-8 h-8 bg-pink-300 rounded-full"></div>
      </div>
      
      <div className="absolute right-6 top-1/3">
        <div className="w-10 h-10 bg-pink-300 rounded-full"></div>
      </div>
      
      <div className="absolute left-8 top-1/2">
        <div className="w-6 h-6 bg-green-300 rounded-full"></div>
      </div>
      
      <div className="absolute right-8 top-1/2">
        <div className="w-8 h-8 bg-green-300 rounded-full"></div>
      </div>
      
      <div className="absolute left-4 bottom-1/3">
        <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
      </div>
      
      <div className="absolute right-4 bottom-1/4">
        <div className="w-10 h-10 bg-yellow-300 rounded-full"></div>
      </div>

      {/* Bottom decorative dogs */}
      <div className="absolute bottom-6 left-8">
        <div className="relative">
          <div className="w-24 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
            <div className="text-2xl">🐕</div>
          </div>
          <div className="absolute -top-2 left-2 w-6 h-6 bg-yellow-300 rounded-full"></div>
        </div>
      </div>

      <div className="absolute bottom-6 right-8">
        <div className="relative">
          <div className="w-24 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
            <div className="text-2xl">🐕</div>
          </div>
          <div className="absolute -top-2 right-2 w-6 h-6 bg-green-300 rounded-full"></div>
        </div>
      </div>

      {/* Bottom grass elements */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-green-200 rounded-t-full"></div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-sm">🥩</span>
              </div>
              <h1 className="text-3xl font-bold text-blue-500">
                Kết Nối Đẹp
              </h1>
              <div className="w-8 h-8 bg-green-300 rounded-full flex items-center justify-center">
                <span className="text-sm">🍓</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-orange-100 rounded-3xl p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Tạo tài khoản</h2>
              <p className="text-gray-600 text-sm">Điền thông tin của bạn để bắt đầu</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-sm font-medium">Tên</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              {...field}
                              placeholder="Tên"
                              className="pl-10 bg-white border-gray-300 rounded-lg h-10 text-sm"
                              data-testid="input-firstName"
                            />
                          </div>
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
                        <FormLabel className="text-gray-700 text-sm font-medium">Họ</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                              {...field}
                              placeholder="Họ"
                              className="pl-10 bg-white border-gray-300 rounded-lg h-10 text-sm"
                              data-testid="input-lastName"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-sm font-medium">Tên người dùng</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            {...field}
                            placeholder="Chọn tên người dùng duy nhất"
                            className="pl-10 bg-white border-gray-300 rounded-lg h-10 text-sm"
                            data-testid="input-username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Mật khẩu"
                            className="pl-10 bg-white border-gray-300 rounded-lg h-10 text-sm"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-sm font-medium">Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Xác nhận mật khẩu của bạn"
                            className="pl-10 bg-white border-gray-300 rounded-lg h-10 text-sm"
                            data-testid="input-confirmPassword"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hidden password field for validation but not displayed */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Tạo mật khẩu mạnh"
                          data-testid="input-password"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-sync password with confirmPassword for validation
                            form.setValue('confirmPassword', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-11 text-sm font-semibold mt-4"
                  disabled={signUp.isPending}
                  data-testid="button-signup"
                >
                  {signUp.isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}