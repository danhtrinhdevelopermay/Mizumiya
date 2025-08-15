import { useState } from "react";
import { Home, Users, Calendar, Settings, Menu, Bell, MessageCircle, Bookmark, User, LogOut, Tv, Store } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function MobileNav() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();

  // Get unread notifications count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  // Main navigation items matching the kawaii design
  const mainNavItems = [
    { href: "/", icon: Home, testId: "mobile-link-home" },
    { href: "/friends", icon: Users, testId: "mobile-link-friends" },
    { href: "/events", icon: Calendar, testId: "mobile-link-events" },
    { href: "/settings", icon: Settings, testId: "mobile-link-settings" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" data-testid="mobile-nav">
      {/* Kawaii Navigation Container */}
      <div className="flex items-center justify-center pb-8 pt-4 px-4">
        <div className="bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-300 rounded-full p-2 shadow-2xl border border-white/20">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center space-x-6">
              {mainNavItems.map((item) => {
                const isActive = location === item.href || (item.href === "/" && location === "/home");
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 ${
                        isActive 
                          ? "bg-gradient-to-br from-orange-400 to-yellow-400 shadow-lg scale-110" 
                          : "bg-gray-100/80 hover:bg-orange-100"
                      }`}
                      data-testid={item.testId}
                    >
                      <Icon className={`h-6 w-6 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-gray-600"
                      }`} />
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Dropdown */}
      <div className="absolute bottom-20 right-4">
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`w-14 h-14 rounded-full transition-all duration-300 transform hover:scale-110 flex items-center justify-center shadow-xl ${
              isMobileMenuOpen 
                ? "bg-gradient-to-br from-pink-400 to-rose-400 rotate-45" 
                : "bg-gradient-to-br from-purple-400 to-blue-400"
            }`}
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
          
          {/* Kawaii Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute bottom-full right-0 mb-4 w-72 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-200/30 py-4 px-2 transform transition-all duration-300 scale-100 origin-bottom-right">
              <div className="space-y-2">
                <Link href="/saved">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-md">
                      <Bookmark className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">💖 Đã lưu</span>
                  </div>
                </Link>
                
                <Link href="/videos">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
                      <Tv className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">📺 Video kawaii</span>
                  </div>
                </Link>
                
                <Link href="/beauty-contest">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-md">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">👑 Cuộc thi sắc đẹp</span>
                  </div>
                </Link>
                
                <Link href="/notifications">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md relative">
                      <Bell className="h-5 w-5 text-white" />
                      {unreadCount.count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white">
                          {unreadCount.count > 9 ? '9+' : unreadCount.count}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-800 font-medium">🔔 Thông báo</span>
                  </div>
                </Link>
                
                <Link href="/messages">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-md">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">💬 Tin nhắn</span>
                  </div>
                </Link>
                
                <Link href="/profile">
                  <div 
                    className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium">👤 Hồ sơ cá nhân</span>
                  </div>
                </Link>
                
                <div className="border-t border-orange-200/50 my-3 mx-4"></div>
                
                <button
                  onClick={() => {
                    signOut.mutate();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-4 px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-200 transform hover:scale-105 w-full text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center shadow-md">
                    <LogOut className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-red-600 font-medium">👋 Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Kawaii Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gradient-to-b from-orange-100/20 to-pink-100/20 backdrop-blur-sm z-[-1]"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
