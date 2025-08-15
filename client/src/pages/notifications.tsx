import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, Trash2, Users, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { NotificationWithUser } from "@shared/schema";

function NotificationIcon({ type, category }: { type: string; category: string }) {
  const iconMap = {
    like: Heart,
    comment: MessageCircle,
    friend_request: UserPlus,
    friend_accept: UserCheck,
    friend_decline: UserCheck,
    new_post: Users,
  };
  
  const Icon = iconMap[category as keyof typeof iconMap] || Bell;
  
  const colorMap = {
    content_interaction: "text-blue-500",
    connection: "text-green-500",
    friend_activity: "text-purple-500",
    messaging: "text-orange-500",
    group: "text-indigo-500",
    event: "text-pink-500",
    system: "text-gray-500",
  };
  
  return <Icon className={`h-5 w-5 ${colorMap[type as keyof typeof colorMap] || "text-gray-500"}`} />;
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
}

function NotificationItem({ notification }: { notification: NotificationWithUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (notification.isRead) return;
      const response = await apiRequest("PATCH", `/api/notifications/${notification.id}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/notifications/${notification.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    }
  });

  // Special handling for friend request notifications
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
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xử lý yêu cầu kết bạn",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    markAsReadMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotificationMutation.mutate();
  };

  const content = (
    <Card className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
      !notification.isRead ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <NotificationIcon type={notification.type} category={notification.category} />
          </div>
          
          {notification.relatedUser?.profileImage ? (
            <img
              src={notification.relatedUser.profileImage}
              alt={`${notification.relatedUser.firstName} ${notification.relatedUser.lastName}`}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  
                  {/* Friend request action buttons */}
                  {notification.category === 'friend_request' && !notification.isRead && (
                    <div className="flex space-x-2 ml-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          respondToFriendRequest.mutate({ status: "accepted" });
                        }}
                        disabled={respondToFriendRequest.isPending}
                        className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid={`button-accept-notification-${notification.id}`}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {respondToFriendRequest.isPending ? "..." : "Chấp nhận"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          respondToFriendRequest.mutate({ status: "declined" });
                        }}
                        disabled={respondToFriendRequest.isPending}
                        className="h-7 px-2 text-xs"
                        data-testid={`button-decline-notification-${notification.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {respondToFriendRequest.isPending ? "..." : "Từ chối"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAsReadMutation.mutate();
                    }}
                    className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return <div onClick={handleClick}>{content}</div>;
}

export default function NotificationsPage() {
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<NotificationWithUser[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/read-all");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "All notifications marked as read",
        description: "All your notifications have been marked as read.",
      });
    }
  });

  // Group notifications by type
  const groupedNotifications = notifications.reduce((groups: { [key: string]: NotificationWithUser[] }, notification: NotificationWithUser) => {
    const key = notification.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(notification);
    return groups;
  }, {});

  const typeLabels = {
    content_interaction: "Content Interactions",
    connection: "Friend Connections", 
    group: "Groups & Pages",
    messaging: "Messages",
    event: "Events",
    system: "System & Reminders",
    friend_activity: "Friends' Activities"
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Notifications
            </h1>
            {unreadCount.count > 0 && (
              <Badge variant="destructive">
                {unreadCount.count}
              </Badge>
            )}
          </div>
          
          {unreadCount.count > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
              size="sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you get likes, comments, friend requests, and other activities, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {typeLabels[type as keyof typeof typeLabels] || type}
                </h2>
                <div className="space-y-2">
                  {typeNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}