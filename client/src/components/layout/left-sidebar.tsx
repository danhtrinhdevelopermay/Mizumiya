import { useQuery } from "@tanstack/react-query";
import { UsersRound, Users, Bookmark, Calendar, Clock, Crown, Play } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";

export default function LeftSidebar() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: friendsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/friends/count"],
  });

  return (
    <aside className="hidden lg:block w-80 sticky top-24 h-fit">
      <div className="modern-card p-6 space-y-4">
        {/* User Profile Section */}
        <Link href="/profile">
          <div className="flex items-center space-x-4 p-4 hover:bg-brand-50 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5">
            <div className="relative">
              <img 
                src={user?.profileImage || "/default-avatar.jpg"} 
                alt="User profile" 
                className="modern-avatar w-14 h-14"
                data-testid="img-profile"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-modern-blue-500 to-modern-purple-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-brand-700 text-base truncate" data-testid="text-username">
                {user && (
                  <UserNameWithBadge 
                    firstName={user.firstName}
                    lastName={user.lastName}
                    badgeImageUrl={user.badgeImageUrl}
                  />
                )}
              </h3>
              <p className="text-sm text-brand-500 font-body">Professional Member</p>
            </div>
          </div>
        </Link>

        {/* Kawaii Navigation Menu */}
        <nav className="space-y-2">
          <Link 
            href="/friends" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-blue-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-friends-nav"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-blue-400 to-kawaii-mint-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <UsersRound className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">👥 Bạn bè kawaii</span>
              <p className="text-xs text-kawaii-blue-500">Kết nối với những người dễ thương</p>
            </div>
            {friendsCount && friendsCount.count > 0 && (
              <span className="bg-gradient-to-r from-kawaii-pink-400 to-kawaii-purple-400 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-bounce-gentle">
                {friendsCount.count}
              </span>
            )}
          </Link>
          <Link 
            href="/groups" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-mint-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-groups"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-mint-400 to-kawaii-blue-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <Users className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">🏪 Nhóm yêu thích</span>
              <p className="text-xs text-kawaii-mint-600">Tham gia cộng đồng vui vẻ</p>
            </div>
          </Link>
          <Link 
            href="/beauty-contest" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-peach-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-beauty-contest"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-peach-400 to-kawaii-pink-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <Crown className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">👑 Cuộc thi sắc đẹp</span>
              <p className="text-xs text-kawaii-peach-600">Tỏa sáng cùng mọi người</p>
            </div>
          </Link>
          <Link 
            href="/saved" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-purple-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-saved"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-purple-400 to-kawaii-pink-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <Bookmark className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">💾 Bài viết đã lưu</span>
              <p className="text-xs text-kawaii-purple-500">Những khoảnh khắc đáng nhớ</p>
            </div>
          </Link>
          <Link 
            href="/events" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-lavender-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-events"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-lavender-400 to-kawaii-blue-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <Calendar className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">📅 Sự kiện vui</span>
              <p className="text-xs text-kawaii-lavender-600">Tham gia những hoạt động thú vị</p>
            </div>
          </Link>
          <Link 
            href="/memories" 
            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-kawaii-mint-50 transition-all duration-300 transform hover:scale-105 group"
            data-testid="link-memories"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-kawaii-mint-400 to-kawaii-purple-400 rounded-full flex items-center justify-center shadow-lg group-hover:animate-kawaii-pulse">
              <Clock className="text-white w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-kawaii-purple-700 text-sm font-cute font-semibold">⏰ Kỷ niệm ngọt ngào</span>
              <p className="text-xs text-kawaii-mint-600">Nhìn lại những điều tuyệt vời</p>
            </div>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
