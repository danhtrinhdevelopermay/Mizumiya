import { useState } from "react";
import { Bell, MessageCircle, Search, Home, Users, Tv, Store, Gamepad2, ChevronDown, LogOut, Settings, User, Menu, Bookmark, Calendar, Crown, Clock, Plus } from "lucide-react";
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
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">f</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-blue-600">
                  facebook
                </h1>
              </div>
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Tìm kiếm trên Facebook"
                className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 border-0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>




          {/* Right Section: Actions & Profile */}
          <div className="flex items-center space-x-2">
            {/* Create/Add Button */}
            <button 
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200"
              data-testid="button-create"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </button>

            {/* Search Button (Mobile) */}
            <button 
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 md:hidden"
              data-testid="button-search-mobile"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Messages */}
            <Link href="/messages">
              <button 
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 relative"
                data-testid="button-messages"
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
                {/* Notification badge for messages can be added here if needed */}
              </button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 h-auto relative"
                  data-testid="button-profile"
                >
                  <div className="relative">
                    <img 
                      src={user?.profileImage || "/default-avatar.jpg"} 
                      alt="User avatar" 
                      className="w-10 h-10 rounded-full border-2 border-transparent hover:border-gray-300"
                    />
                    {/* Notification badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">6</span>
                    </div>
                  </div>
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
