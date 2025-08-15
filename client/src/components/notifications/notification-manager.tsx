import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FriendRequestPopup from "./friend-request-popup";
import type { NotificationWithUser } from "@shared/schema";

export function NotificationManager() {
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [activePopup, setActivePopup] = useState<NotificationWithUser | null>(null);

  const { data: notifications = [] } = useQuery<NotificationWithUser[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000, // Check every 5 seconds for new notifications
  });

  useEffect(() => {
    // Find new friend request notifications that haven't been shown
    const newFriendRequests = notifications.filter(notification => 
      notification.category === 'friend_request' && 
      !notification.isRead && 
      !shownNotifications.has(notification.id)
    );

    if (newFriendRequests.length > 0 && !activePopup) {
      const latestRequest = newFriendRequests[0]; // Show the most recent one
      setActivePopup(latestRequest);
      setShownNotifications(prev => new Set([...Array.from(prev), latestRequest.id]));
    }
  }, [notifications, shownNotifications, activePopup]);

  const handleClosePopup = () => {
    setActivePopup(null);
  };

  const handleAccept = () => {
    // Popup will close automatically after mutation success
  };

  const handleDecline = () => {
    // Popup will close automatically after mutation success
  };

  return (
    <>
      {activePopup && activePopup.category === 'friend_request' && (
        <FriendRequestPopup
          notification={activePopup}
          onClose={handleClosePopup}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}

export default NotificationManager;