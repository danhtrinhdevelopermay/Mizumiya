import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Heart, Share2, Camera, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 desktop-layout">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-primary text-xl font-bold">f</span>
          </div>
          <span className="text-white text-2xl font-bold">Kết Nối Đẹp</span>
        </div>
        <div className="space-x-4">
          <a href="/signin">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 border-white/20 border"
              data-testid="button-signin"
            >
              Đăng nhập
            </Button>
          </a>
          <a href="/signup">
            <Button 
              className="bg-white text-primary hover:bg-gray-100"
              data-testid="button-signup"
            >
              Đăng ký
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Kết nối với bạn bè và thế giới xung quanh bạn trên Kết Nối Đẹp.
            </h1>
            <p className="text-lg sm:text-xl lg:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed">
              Xem ảnh và cập nhật từ bạn bè trong Bảng tin. Chia sẻ những gì mới trong cuộc sống của bạn trên dòng thời gian. Tìm kiếm nhiều hơn những gì bạn đang tìm kiếm.
            </p>
            <div className="space-x-4">
              <a href="/signup">
                <Button 
                  size="lg" 
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg"
                  data-testid="button-signup-hero"
                >
                  Tạo tài khoản mới
                </Button>
              </a>
            </div>
          </div>

          {/* Login Card */}
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <Card className="shadow-2xl w-full">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Đăng nhập</CardTitle>
                <CardDescription className="text-center">
                  Kết nối với bạn bè của bạn ngay hôm nay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <a href="/signin">
                    <Button 
                      className="w-full bg-primary hover:bg-blue-600 mb-4"
                      data-testid="button-signin-card"
                    >
                      Đăng nhập vào tài khoản của bạn
                    </Button>
                  </a>
                  <div className="text-sm text-gray-600">
                    Chưa có tài khoản?{" "}
                    <Link href="/signup" className="text-primary hover:underline">
                      Đăng ký tại đây
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tại sao mọi người yêu thích Kết Nối Đẹp
            </h2>
            <p className="text-xl text-gray-600">
              Luôn kết nối với những người quan trọng nhất với bạn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kết nối với bạn bè</h3>
              <p className="text-gray-600">
                Tìm kiếm và kết nối với bạn bè, gia đình và những người bạn biết
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chia sẻ & Giao tiếp</h3>
              <p className="text-gray-600">
                Chia sẻ cập nhật, ảnh và giữ liên lạc thông qua tin nhắn
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Khám phá & Tìm hiểu</h3>
              <p className="text-gray-600">
                Khám phá các cộng đồng mới và tìm hiểu nội dung bạn quan tâm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">f</span>
                </div>
                <span className="text-primary text-xl font-bold">Kết Nối Đẹp</span>
              </div>
              <p className="text-gray-600 text-sm">
                Làm cho thế giới cởi mở và kết nối hơn.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Bảng tin</a></li>
                <li><a href="#" className="hover:text-primary">Tin nhắn</a></li>
                <li><a href="#" className="hover:text-primary">Tin</a></li>
                <li><a href="#" className="hover:text-primary">Nhóm</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Công ty</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-primary">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-primary">Riêng tư</a></li>
                <li><a href="#" className="hover:text-primary">Điều khoản</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Trung tâm hỗ trợ</a></li>
                <li><a href="#" className="hover:text-primary">Cộng đồng</a></li>
                <li><a href="#" className="hover:text-primary">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 Kết Nối Đẹp. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}