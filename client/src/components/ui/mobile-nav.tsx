import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  User, 
  Bell, 
  Menu,
  Bookmark,
  Calendar,
  Store,
  Clock,
  MessageCircle,
  LogOut,
  Play,
  UserCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNav() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();

  // Get unread notifications count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white shadow-lg border-t border-gray-200 md:hidden">
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-around py-3 px-2">
        {/* Home */}
        <Link href="/">
          <div className="flex flex-col items-center justify-center px-3 py-1 relative" data-testid="mobile-link-home">
            <Home className={`h-7 w-7 ${
              location === "/" || location === "/home" ? "text-blue-600" : "text-gray-600"
            }`} />
            {(location === "/" || location === "/home") && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </Link>

        {/* Videos/Watch */}
        <Link href="/videos">
          <div className="flex flex-col items-center justify-center px-3 py-1 relative" data-testid="mobile-link-videos">
            <div className="relative">
              <Play className={`h-7 w-7 ${
                location === "/videos" ? "text-blue-600" : "text-gray-600"
              }`} />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
            </div>
            {location === "/videos" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </Link>

        {/* Groups/Friends */}
        <Link href="/friends">
          <div className="flex flex-col items-center justify-center px-3 py-1 relative" data-testid="mobile-link-friends">
            <UserCheck className={`h-7 w-7 ${
              location === "/friends" ? "text-blue-600" : "text-gray-600"
            }`} />
            {location === "/friends" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </Link>

        {/* Profile */}
        <Link href="/profile">
          <div className="flex flex-col items-center justify-center px-3 py-1 relative" data-testid="mobile-link-profile">
            <User className={`h-7 w-7 ${
              location === "/profile" ? "text-blue-600" : "text-gray-600"
            }`} />
            {location === "/profile" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </Link>

        {/* Notifications */}
        <Link href="/notifications">
          <div className="flex flex-col items-center justify-center px-3 py-1 relative" data-testid="mobile-link-notifications">
            <div className="relative">
              <Bell className={`h-7 w-7 ${
                location === "/notifications" ? "text-blue-600" : "text-gray-600"
              }`} />
              {unreadCount.count > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{unreadCount.count > 99 ? '99+' : unreadCount.count}</span>
                </div>
              )}
            </div>
            {location === "/notifications" && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </Link>

        {/* Menu */}
        <div className="flex flex-col items-center justify-center px-3 py-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative"
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-7 w-7 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Facebook-style Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="fixed bottom-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] min-w-[280px]">
          <div className="p-2">
            <Link href="/saved" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Đã lưu</span>
              </div>
            </Link>
            
            <Link href="/events" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Sự kiện</span>
              </div>
            </Link>
            
            <Link href="/marketplace" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Store className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Marketplace</span>
              </div>
            </Link>

            <Link href="/groups" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Nhóm</span>
              </div>
            </Link>

            <Link href="/memories" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Kỷ niệm</span>
              </div>
            </Link>

            <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Tin nhắn</span>
              </div>
            </Link>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            <button
              onClick={() => {
                signOut.mutate();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-100 rounded-lg transition-all duration-200 w-full"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <LogOut className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-gray-800 font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-[9998]"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}