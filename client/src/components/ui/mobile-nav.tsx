import { useState } from "react";
import { Home, Users, Tv, Store, Menu, Bell, MessageCircle, Bookmark, Calendar, User, LogOut } from "lucide-react";
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

  // Main navigation items (only 5 like Facebook)
  const mainNavItems = [
    { href: "/", icon: Home, testId: "mobile-link-home" },
    { href: "/friends", icon: Users, testId: "mobile-link-friends" },
    { href: "/beauty-contest", icon: Tv, testId: "mobile-link-contest" },
    { href: "/groups", icon: Store, testId: "mobile-link-groups" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 z-50 shadow-xl" data-testid="mobile-nav">
      <div className="grid grid-cols-5 py-2 px-2">
        {mainNavItems.map((item) => {
          const isActive = location === item.href || (item.href === "/" && location === "/home");
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-br from-purple-400 to-blue-500 shadow-lg transform scale-105" 
                    : "hover:bg-purple-50"
                }`}
                data-testid={item.testId}
              >
                <Icon className={`h-6 w-6 ${
                  isActive ? "text-white" : "text-gray-600"
                }`} />
              </div>
            </Link>
          );
        })}
        
        {/* Mobile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center p-3 w-full" 
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-6 w-6 text-gray-500" />
          </button>
          
          {/* Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <Link href="/saved">
                <div 
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bookmark className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Đã lưu</span>
                </div>
              </Link>
              <Link href="/events">
                <div 
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Sự kiện</span>
                </div>
              </Link>
              <Link href="/videos">
                <div 
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Tv className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Video YouTube</span>
                </div>
              </Link>
              <Link href="/memories">
                <div 
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Kỷ niệm</span>
                </div>
              </Link>
              <Link href="/profile">
                <div 
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Hồ sơ cá nhân</span>
                </div>
              </Link>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  signOut.mutate();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay to close menu when clicking outside */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-[-1]"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
}
