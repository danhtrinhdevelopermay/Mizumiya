import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { User, UserWithFriendshipStatus } from "@shared/schema";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  const { data: friendRequests = [] } = useQuery<UserWithFriendshipStatus[]>({
    queryKey: ["/api/friends/requests"],
  });

  const { data: friendsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/friends/count"],
  });

  const respondToFriendRequest = useMutation({
    mutationFn: async ({ friendshipId, status }: { friendshipId: string; status: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/count"] });
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

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (conversation) => {
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

  // Find friendship ID for a given request
  const findFriendshipId = (request: any) => {
    return request.friendshipId || request.id;
  };

  if (!user) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Friends</h1>
        <p className="text-muted-foreground">
          {friendsCount ? `${friendsCount.count} friends` : "0 friends"}
        </p>
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Friend Requests</h2>
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
              {friendRequests.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={request.profileImage || "/api/placeholder/60"} 
                    alt={`${request.firstName} ${request.lastName}`}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <div>
                    <h3 className="font-medium text-foreground">
                      <UserNameWithBadge 
                        firstName={request.firstName}
                        lastName={request.lastName}
                        badgeImageUrl={request.badgeImageUrl}
                      />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {request.mutualFriendsCount || 0} mutual friends
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => respondToFriendRequest.mutate({ 
                      friendshipId: findFriendshipId(request), 
                      status: "accepted" 
                    })}
                    disabled={respondToFriendRequest.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50"
                    data-testid={`button-confirm-${request.id}`}
                  >
                    {respondToFriendRequest.isPending ? "..." : "Confirm"}
                  </button>
                  <button 
                    onClick={() => respondToFriendRequest.mutate({ 
                      friendshipId: findFriendshipId(request), 
                      status: "declined" 
                    })}
                    disabled={respondToFriendRequest.isPending}
                    className="px-4 py-2 bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    data-testid={`button-decline-${request.id}`}
                  >
                    {respondToFriendRequest.isPending ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Friends */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for friends..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* All Friends */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">All Friends</h2>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">{friends.length} friends</span>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="text-center p-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Send friend requests to connect with people you know
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={friend.profileImage || "/api/placeholder/60"} 
                    alt={`${friend.firstName} ${friend.lastName}`}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <div>
                    <h3 className="font-medium text-foreground">
                      <UserNameWithBadge 
                        firstName={friend.firstName}
                        lastName={friend.lastName}
                        badgeImageUrl={friend.badgeImageUrl}
                      />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {friend.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => startConversation.mutate(friend.id)}
                    disabled={startConversation.isPending}
                    className="flex-1 px-3 py-2 bg-gray-100 text-foreground rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
                    data-testid={`button-message-${friend.id}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {startConversation.isPending ? "..." : "Message"}
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-foreground rounded-lg hover:bg-gray-200">
                    Unfriend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}