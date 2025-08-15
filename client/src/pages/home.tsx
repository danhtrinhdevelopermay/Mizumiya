import Header from "@/components/layout/header";
import LeftSidebar from "@/components/layout/left-sidebar";
import RightSidebar from "@/components/layout/right-sidebar";
import Stories from "@/components/feed/stories";
import CreatePost from "@/components/feed/create-post";
import NewsFeed from "@/components/feed/news-feed";
import MobileNav from "@/components/ui/mobile-nav";
import { useScreenSize } from "@/hooks/useScreenSize";

export default function Home() {
  console.log("🏠 Home component is rendering");
  const { isDesktop, isMobile } = useScreenSize();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - show on desktop */}
      <div className={isDesktop ? "block" : "hidden"}>
        <Header />
      </div>
      
      {/* Mobile Header - show on mobile */}
      <div className={isMobile ? "block bg-white shadow-md sticky top-0 z-50 border-b border-gray-200" : "hidden"}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">f</span>
            </div>
            <h1 className="text-lg font-bold text-blue-600">Facebook</h1>
          </div>
        </div>
      </div>
      
      {/* Main Layout */}
      <div className={isDesktop ? "max-w-screen-xl mx-auto flex gap-6 pt-4" : "block"}>
        {/* Left Sidebar - only on desktop */}
        <div className={isDesktop ? "block w-80 flex-shrink-0" : "hidden"}>
          <LeftSidebar />
        </div>
        
        {/* Main Content */}
        <main className={isDesktop ? "flex-1 max-w-2xl mx-auto" : "px-4 pt-4 pb-20"}>
          <CreatePost />
          <Stories />
          <NewsFeed />
        </main>
        
        {/* Right Sidebar - only on desktop */}
        <div className={isDesktop ? "block w-80 flex-shrink-0" : "hidden"}>
          <RightSidebar />
        </div>
      </div>
      
      {/* Mobile Navigation - only show on mobile */}
      <div className={isMobile ? "block" : "hidden"}>
        <MobileNav />
      </div>
    </div>
  );
}
