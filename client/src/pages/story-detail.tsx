import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import { VideoPlayer } from "@/components/ui/video-player";
import { StoryWithUser, StoryCommentWithUser, User } from "@shared/schema";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Trash2, 
  Clock,
  ThumbsUp,
  Laugh,
  Angry,
  Frown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const REACTION_EMOJIS = {
  like: { icon: ThumbsUp, emoji: "👍", label: "Like" },
  love: { icon: Heart, emoji: "❤️", label: "Love" },
  laugh: { icon: Laugh, emoji: "😆", label: "Haha" },
  angry: { icon: Angry, emoji: "😡", label: "Angry" },
  sad: { icon: Frown, emoji: "😢", label: "Sad" }
};

export default function StoryDetail() {
  const { storyId } = useParams<{ storyId: string }>();
  const [, setLocation] = useLocation();
  const [commentText, setCommentText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  // Get story details
  const { data: story, isLoading: storyLoading } = useQuery<StoryWithUser>({
    queryKey: ["/api/stories", storyId],
  });

  // Get story comments
  const { data: comments = [] } = useQuery<StoryCommentWithUser[]>({
    queryKey: ["/api/stories", storyId, "comments"],
    enabled: !!storyId,
  });

  // Get story reactions
  const { data: reactions = [] } = useQuery<any[]>({
    queryKey: ["/api/stories", storyId, "reactions"],
    enabled: !!storyId,
  });

  // Check if current user has reacted
  const userReaction = reactions.find(r => r.userId === currentUser?.id);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/stories/${storyId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "comments"] });
      setCommentText("");
      toast({
        title: "Bình luận đã được thêm",
        description: "Bình luận của bạn đã được đăng thành công."
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm bình luận. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest(`/api/stories/${storyId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ type })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "reactions"] });
      setShowReactions(false);
    },
    onError: () => {
      toast({
        title: "Lỗi", 
        description: "Không thể thêm cảm xúc. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/stories/${storyId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Story đã được xóa",
        description: "Story của bạn đã được xóa thành công."
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa story. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleReaction = (type: string) => {
    addReactionMutation.mutate(type);
  };

  const handleDeleteStory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa story này?")) {
      deleteStoryMutation.mutate();
    }
  };

  if (storyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang tải story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Story không tồn tại</h2>
          <p className="text-gray-600 mb-4">Story này có thể đã bị xóa hoặc hết hạn.</p>
          <Button onClick={() => setLocation("/")}>
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const timeRemaining = new Date(story.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar>
              <AvatarImage src={story.user.profileImage || ""} />
              <AvatarFallback>
                {story.user.firstName[0]}{story.user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                <UserNameWithBadge 
                  firstName={story.user.firstName}
                  lastName={story.user.lastName}
                  badgeImageUrl={story.user.badgeImageUrl}
                />
              </h3>
              <p className="text-sm text-gray-500">
                @{story.user.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hoursLeft}h {minutesLeft}m còn lại
            </Badge>
            {currentUser?.id === story.userId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteStory}
                disabled={deleteStoryMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Story Media */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  {story.image.includes('/video/') || story.image.match(/\.(mp4|avi|mov|webm|mkv)$/i) ? (
                    <VideoPlayer
                      src={story.image}
                      className="w-full h-auto max-h-[70vh] rounded-t-lg"
                      enableControls={true}
                      autoPlay={false}
                      muted={false}
                    />
                  ) : (
                    <img
                      src={story.image}
                      alt="Story"
                      className="w-full h-auto max-h-[70vh] object-contain rounded-t-lg"
                    />
                  )}
                  {story.content && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                      <p>{story.content}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments & Reactions */}
          <div className="space-y-4">
            {/* Story Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {/* Reactions */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReactions(!showReactions)}
                      className="flex items-center gap-2"
                    >
                      {userReaction ? (
                        <>
                          <span>{REACTION_EMOJIS[userReaction.type as keyof typeof REACTION_EMOJIS]?.emoji}</span>
                          <span>{REACTION_EMOJIS[userReaction.type as keyof typeof REACTION_EMOJIS]?.label}</span>
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4" />
                          <span>Thả cảm xúc</span>
                        </>
                      )}
                    </Button>
                    
                    {showReactions && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 flex gap-1 z-20">
                        {Object.entries(REACTION_EMOJIS).map(([type, { emoji, label }]) => (
                          <Button
                            key={type}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(type)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title={label}
                          >
                            <span className="text-lg">{emoji}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {reactions.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {reactions.length} cảm xúc
                    </span>
                  )}
                </div>

                <Separator />
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser?.profileImage || ""} />
                    <AvatarFallback>
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Viết bình luận..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Bình luận ({comments.length})
                </h4>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user.profileImage || ""} />
                        <AvatarFallback>
                          {comment.user.firstName[0]}{comment.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              <UserNameWithBadge 
                                firstName={comment.user.firstName}
                                lastName={comment.user.lastName}
                                badgeImageUrl={comment.user.badgeImageUrl}
                              />
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Chưa có bình luận nào
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}