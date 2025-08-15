import { ReactNode } from "react";
import Header from "./header";
import LeftSidebar from "./left-sidebar";
import RightSidebar from "./right-sidebar";
import NotificationManager from "../notifications/notification-manager";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Header />
      <div className="max-w-7xl mx-auto flex px-4 lg:px-8 pt-4">
        {/* Left Sidebar - hiển thị từ lg (1024px) trở lên */}
        <aside className="w-80 sticky top-24 h-screen overflow-y-auto hidden lg:block pr-6 shrink-0">
          <LeftSidebar />
        </aside>
        
        {/* Main Content - responsive width */}
        <main className="flex-1 min-w-0 px-2 sm:px-4 lg:px-6 pb-16 lg:pb-8 max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto lg:mx-0 modern-spacing">
          {children}
        </main>
        
        {/* Right Sidebar - hiển thị từ xl (1280px) trở lên */}
        <aside className="w-80 sticky top-24 h-screen overflow-y-auto hidden xl:block pl-6 shrink-0">
          <RightSidebar />
        </aside>
      </div>
      <NotificationManager />
    </div>
  );
}