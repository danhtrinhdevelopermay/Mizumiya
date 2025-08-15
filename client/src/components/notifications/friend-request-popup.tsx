import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import type { NotificationWithUser } from "@shared/schema";

interface FriendRequestPopupProps {
  notification: NotificationWithUser;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function FriendRequestPopup({ notification, onClose, onAccept, onDecline }: FriendRequestPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const respondToFriendRequest = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      // Find the friendship ID by searching friend requests
      const friendRequestsResponse = await fetch("/api/friends/requests");
      const friendRequests = await friendRequestsResponse.json();
      
      const request = friendRequests.find((req: any) => req.id === notification.relatedUserId);
      const friendshipId = request?.friendshipId || request?.id;
      
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to respond to friend request');
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === "accepted" ? "Đã chấp nhận yêu cầu kết bạn" : "Đã từ chối yêu cầu kết bạn",
        description: status === "accepted" ? "Bạn và người này đã trở thành bạn bè!" : "Yêu cầu kết bạn đã được từ chối",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      if (status === "accepted") {
        onAccept();
      } else {
        onDecline();
      }
      
      setIsVisible(false);
      setTimeout(onClose, 300);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xử lý yêu cầu kết bạn",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAccept = () => {
    respondToFriendRequest.mutate({ status: "accepted" });
  };

  const handleDecline = () => {
    respondToFriendRequest.mutate({ status: "declined" });
  };

  if (!notification.relatedUser) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    }`}>
      <Card className="w-80 shadow-lg border-l-4 border-l-blue-500 bg-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Yêu cầu kết bạn mới</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              data-testid="button-close-popup"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={notification.relatedUser.profileImage || "/default-avatar.jpg"}
              alt={`${notification.relatedUser.firstName} ${notification.relatedUser.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                <UserNameWithBadge 
                  firstName={notification.relatedUser.firstName}
                  lastName={notification.relatedUser.lastName}
                  badgeImageUrl={notification.relatedUser.badgeImageUrl}
                />
              </p>
              <p className="text-sm text-gray-600">
                @{notification.relatedUser.username}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-4">
            {notification.message}
          </p>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleAccept}
              disabled={respondToFriendRequest.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-accept-popup"
            >
              <Check className="h-4 w-4 mr-1" />
              {respondToFriendRequest.isPending ? "..." : "Chấp nhận"}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={respondToFriendRequest.isPending}
              variant="outline"
              className="flex-1"
              data-testid="button-decline-popup"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {respondToFriendRequest.isPending ? "..." : "Từ chối"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FriendRequestPopup;