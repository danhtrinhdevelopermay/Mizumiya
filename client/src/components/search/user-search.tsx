import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, Users, MessageCircle } from "lucide-react";
import { Link } from "wouter";

interface UserSearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  friendshipStatus?: string;
  mutualFriendsCount?: number;
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/users/search", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Optionally refresh search results or show success message
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const getFriendshipStatusText = (status?: string) => {
    switch (status) {
      case "pending":
        return "Yêu cầu đã gửi";
      case "accepted":
        return "Bạn bè";
      case "declined":
        return "Đã từ chối";
      default:
        return null;
    }
  };

  const getFriendshipButton = (user: UserSearchResult) => {
    const statusText = getFriendshipStatusText(user.friendshipStatus);
    
    if (statusText) {
      return (
        <Button variant="outline" size="sm" disabled>
          {statusText}
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => handleSendFriendRequest(user.id)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Kết bạn
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Tìm kiếm người dùng theo tên hoặc username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && debouncedQuery && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Kết quả tìm kiếm</h3>
          {searchResults.map((user: UserSearchResult) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href={`/user/${user.id}`} className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                        {user.mutualFriendsCount && user.mutualFriendsCount > 0 && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            {user.mutualFriendsCount} bạn chung
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getFriendshipButton(user)}
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Nhắn tin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchResults && searchResults.length === 0 && debouncedQuery && (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy người dùng nào với từ khóa "{debouncedQuery}"</p>
        </div>
      )}

      {!debouncedQuery && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nhập tên hoặc username để tìm kiếm người dùng</p>
        </div>
      )}
    </div>
  );
}