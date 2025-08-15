import { useState } from "react";
import { Bell, MessageCircle, Search, Home, Users, Tv, Store, Gamepad2, ChevronDown, LogOut, Settings, User, Menu, Bookmark, Calendar, Crown, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Maintain online status
  useOnlineStatus();
  
  // Get unread notifications count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section: Logo & Search */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-modern-blue-500 to-modern-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">K</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-modern-blue-600 to-modern-purple-600 bg-clip-text text-transparent">
                  Kết Nối Đẹp
                </h1>
                <p className="text-xs text-gray-600 font-body">Professional Social Network</p>
              </div>
            </div>
            
            {/* Modern Search Bar */}
            <div className="relative hidden md:block">
              <input 
                type="text"
                placeholder="Tìm kiếm bạn bè, nội dung..."
                className="modern-input w-72 lg:w-96 pl-12 pr-4 text-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Center Navigation - Modern style */}
          <nav className="hidden lg:flex space-x-2">
            <Link href="/home">
              <div className={`flex items-center justify-center px-6 py-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                location === "/" || location === "/home" 
                  ? "bg-gradient-to-r from-modern-blue-500 to-modern-purple-500 text-white shadow-lg" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`} data-testid="link-home">
                <Home className="h-5 w-5 mr-2" />
                <span className="font-modern text-sm">Trang chủ</span>
              </div>
            </Link>
            <Link href="/friends">
              <div className={`flex items-center justify-center px-6 py-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                location === "/friends" 
                  ? "bg-gradient-to-r from-modern-blue-500 to-modern-purple-500 text-white shadow-lg" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`} data-testid="link-friends">
                <Users className="h-5 w-5 mr-2" />
                <span className="font-modern text-sm">Bạn bè</span>
              </div>
            </Link>
            <Link href="/beauty-contest">
              <div className={`flex items-center justify-center px-6 py-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                location === "/beauty-contest" 
                  ? "bg-gradient-to-r from-modern-blue-500 to-modern-purple-500 text-white shadow-lg" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`} data-testid="link-watch">
                <Crown className="h-5 w-5 mr-2" />
                <span className="font-modern text-sm">Cuộc thi</span>
              </div>
            </Link>
            <Link href="/groups">
              <div className={`flex items-center justify-center px-6 py-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                location === "/groups" 
                  ? "bg-gradient-to-r from-modern-blue-500 to-modern-purple-500 text-white shadow-lg" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`} data-testid="link-marketplace">
                <Store className="h-5 w-5 mr-2" />
                <span className="font-modern text-sm">Nhóm</span>
              </div>
            </Link>
          </nav>



          {/* Right Section: Actions & Profile */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Link href="/notifications">
              <button 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 relative"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] font-bold">
                    {unreadCount.count > 99 ? '99+' : unreadCount.count}
                  </span>
                )}
              </button>
            </Link>
            
            {/* Messages */}
            <Link href="/messages">
              <button 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200"
                data-testid="button-messages"
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1.5 h-auto"
                  data-testid="button-profile"
                >
                  <div className="relative">
                    <img 
                      src={user?.profileImage || "/default-avatar.jpg"} 
                      alt="User avatar" 
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 hidden md:block max-w-[120px] truncate">
                    <UserNameWithBadge 
                      firstName={user?.firstName || ""}
                      lastName={user?.lastName || ""}
                      badgeImageUrl={user?.badgeImageUrl}
                    />
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-600 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                <div className="flex items-center space-x-3 p-3 border-b border-gray-200">
                  <img 
                    src={user?.profileImage || "/default-avatar.jpg"} 
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      <UserNameWithBadge 
                        firstName={user?.firstName || ""}
                        lastName={user?.lastName || ""}
                        badgeImageUrl={user?.badgeImageUrl}
                      />
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="border-gray-200" />
                <DropdownMenuItem className="py-3 px-4 hover:bg-gray-100">
                  <Link href="/profile" className="flex items-center w-full">
                    <User className="mr-3 h-5 w-5 text-gray-600" />
                    <span className="text-gray-900 font-medium">Hồ sơ cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-3 px-4 hover:bg-gray-100">
                  <Settings className="mr-3 h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-gray-200" />
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await signOut.mutateAsync();
                      toast({
                        title: "Đăng xuất thành công",
                        description: "Bạn đã đăng xuất khỏi hệ thống.",
                      });
                    } catch (error) {
                      toast({
                        title: "Lỗi",
                        description: "Không thể đăng xuất. Vui lòng thử lại.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="text-red-600 py-3 px-4 hover:bg-red-50"
                  data-testid="button-signout"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="font-medium">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
