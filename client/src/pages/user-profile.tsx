import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/layout";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Post from "@/components/feed/post";
import { apiRequest } from "@/lib/queryClient";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import type { UserWithFriendshipStatus, PostWithUser } from "@shared/schema";

export default function UserProfile() {
  const [match, params] = useRoute("/user/:userId");
  const userId = params?.userId;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<UserWithFriendshipStatus>({
    queryKey: ["/api/users", userId, "profile"],
    queryFn: () => fetch(`/api/users/${userId}/profile`).then(res => {
      if (!res.ok) throw new Error('User not found');
      return res.json();
    }),
    enabled: !!userId,
  });

  const { data: userPosts } = useQuery<PostWithUser[]>({
    queryKey: ["/api/users", userId, "posts"],
    queryFn: () => fetch(`/api/users/${userId}/posts`).then(res => res.json()),
    enabled: !!userId,
  });

  const sendFriendRequest = useMutation({
    mutationFn: () => fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to send friend request');
      return res.json();
    }),
    onSuccess: () => {
      toast({
        title: "Yêu cầu kết bạn đã được gửi",
        description: "Chờ người dùng phản hồi yêu cầu của bạn",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "profile"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu kết bạn",
        variant: "destructive",
      });
    },
  });

  const startConversation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (conversation) => {
      // Navigate to messages page with the conversation
      setLocation(`/messages?conversation=${conversation.id}`);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo cuộc trò chuyện",
        variant: "destructive",
      });
    },
  });

  const getFriendshipButton = () => {
    if (!user) return null;

    switch (user.friendshipStatus) {
      case "pending":
        return (
          <Button variant="outline" disabled>
            Yêu cầu đã gửi
          </Button>
        );
      case "accepted":
        return (
          <Button variant="outline" disabled>
            <Users className="w-4 h-4 mr-2" />
            Bạn bè
          </Button>
        );
      case "declined":
        return (
          <Button 
            onClick={() => sendFriendRequest.mutate()}
            disabled={sendFriendRequest.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Kết bạn
          </Button>
        );
      default:
        return (
          <Button 
            onClick={() => sendFriendRequest.mutate()}
            disabled={sendFriendRequest.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Kết bạn
          </Button>
        );
    }
  };

  if (!match || !userId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">User not found</h1>
            <Link href="/">
              <Button>Go back to home</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">User not found</h1>
            <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>Go back to home</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center p-4 border-b">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{user.firstName} {user.lastName}</h1>
        </div>

        {/* Cover Photo */}
        <div className="relative h-80 bg-gradient-to-r from-blue-400 to-purple-500">
          {user.coverImage && (
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="bg-white px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16">
            <div className="relative">
              <img
                src={user.profileImage || "/default-avatar.jpg"}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 truncate">
                    <UserNameWithBadge 
                      firstName={user.firstName}
                      lastName={user.lastName}
                      badgeImageUrl={user.badgeImageUrl}
                    />
                  </h1>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.bio && (
                    <p className="mt-2 text-gray-700 max-w-2xl">{user.bio}</p>
                  )}
                  {user.mutualFriendsCount && user.mutualFriendsCount > 0 && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Users className="w-4 h-4 mr-1" />
                      {user.mutualFriendsCount} bạn chung
                    </div>
                  )}
                </div>
                <div className="flex space-x-3 mt-4 sm:mt-0">
                  {getFriendshipButton()}
                  <Button 
                    variant="outline"
                    onClick={() => startConversation.mutate()}
                    disabled={startConversation.isPending}
                    data-testid="button-message"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {startConversation.isPending ? "Đang tạo..." : "Nhắn tin"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {user.workplace && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Works at:</span>
                  <span className="ml-2">{user.workplace}</span>
                </div>
              )}
              {user.education && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Studied at:</span>
                  <span className="ml-2">{user.education}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Lives in:</span>
                  <span className="ml-2">{user.location}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {user.relationshipStatus && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Relationship:</span>
                  <span className="ml-2 capitalize">{user.relationshipStatus}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">Website:</span>
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                    {user.website}
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Joined:</span>
                <span className="ml-2">
                  {new Date(user.createdAt!).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Bài viết</h2>
            {userPosts && userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>{user.firstName} chưa có bài viết nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}