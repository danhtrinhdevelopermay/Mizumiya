import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { ThumbsUp, MessageCircle, Share, MoreHorizontal, Heart, Smile, Laugh, Angry, Frown, Download, Link as LinkIcon, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PostWithUser, CommentWithUser } from "@shared/schema";
import { Link } from "wouter";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import { VideoPlayer } from "@/components/ui/video-player";
// Remove import for now, will implement inline

interface PostProps {
  post: PostWithUser;
  comments?: CommentWithUser[];
}

const reactionTypes = [
  { type: "like", icon: ThumbsUp, color: "text-modern-blue-500", bgColor: "bg-gradient-to-r from-modern-blue-500 to-modern-blue-600", emoji: "👍" },
  { type: "love", icon: Heart, color: "text-modern-purple-500", bgColor: "bg-gradient-to-r from-modern-purple-500 to-modern-purple-600", emoji: "💖" },
  { type: "laugh", icon: Laugh, color: "text-brand-500", bgColor: "bg-gradient-to-r from-brand-500 to-brand-600", emoji: "😂" },
  { type: "angry", icon: Angry, color: "text-red-500", bgColor: "bg-gradient-to-r from-red-500 to-red-600", emoji: "😠" },
  { type: "sad", icon: Frown, color: "text-brand-400", bgColor: "bg-gradient-to-r from-brand-400 to-brand-500", emoji: "😢" },
];

// Video component removed - now using direct video element with controls

export default function Post({ post, comments = [] }: PostProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ`;
    return `${Math.floor(diffInHours / 24)} ngày`;
  };

  const toggleReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/like`, {
        type: reactionType
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      setShowReactionPicker(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể phản hồi bài viết. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      setCommentText("");
      setShowComments(true);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đăng bình luận. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (reactionType: string) => {
    toggleReactionMutation.mutate(reactionType);
  };

  const handleQuickLike = () => {
    handleReaction("like");
  };

  const downloadWithWatermark = async (imageUrl: string, filename: string) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Add watermark
        const watermarkHeight = 60;
        const gradient = ctx.createLinearGradient(0, canvas.height - watermarkHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - watermarkHeight, canvas.width, watermarkHeight);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('FaceConnect', 20, canvas.height - 35);
        ctx.font = '14px Arial';
        ctx.fillText(`@${post.user.firstName} ${post.user.lastName}`, 20, canvas.height - 15);
        
        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      };
      
      img.src = imageUrl;
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image with watermark.",
        variant: "destructive",
      });
    }
  };

  const shareViaLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Post link has been copied to clipboard.",
    });
    setShowShareDialog(false);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <article className="bg-white rounded-3xl shadow-lg mb-6 overflow-hidden" data-testid={`post-${post.id}`}>
      {/* Post Header */}
      <div className="p-6 flex items-center space-x-4">
        <Link href={`/user/${post.user.id}`}>
          <div className="relative">
            {/* Avatar với nền be/cream giống hình */}
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
              <img 
                src={post.user.profileImage || "/default-avatar.jpg"} 
                alt={`${post.user.firstName} ${post.user.lastName}`} 
                className="w-10 h-10 rounded-full object-cover"
                data-testid={`img-author-${post.id}`}
              />
            </div>
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/user/${post.user.id}`}>
            <h3 className="font-bold text-gray-800 text-lg hover:text-blue-600 cursor-pointer transition-colors" data-testid={`text-author-name-${post.id}`}>
              <UserNameWithBadge 
                firstName={post.user.firstName}
                lastName={post.user.lastName}
                badgeImageUrl={post.user.badgeImageUrl}
              />
            </h3>
          </Link>
          <p className="text-sm text-gray-500" data-testid={`text-post-time-${post.id}`}>
            {formatTimeAgo(post.createdAt!)} · Công khai
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-6">
        <Link href={`/post/${post.id}`}>
          <p className="text-gray-800 text-base leading-relaxed hover:bg-gray-50 cursor-pointer transition-all duration-300 p-4 -m-4 rounded-2xl" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
        </Link>
        {post.images && post.images.length > 0 && (
          <Link href={`/post/${post.id}`}>
            <div className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity mt-4 ${post.images.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
              {post.images.map((mediaUrl, index) => {
                // Check if it's a video file
                const isVideo = mediaUrl.includes('/video/') || 
                               mediaUrl.match(/\.(mp4|avi|mov|webm|mkv)$/i);
                
                return isVideo ? (
                  <div key={index} className="relative">
                    <video 
                      src={mediaUrl}
                      className={`w-full rounded-lg object-cover ${post.images!.length === 1 ? 'max-h-96' : 'h-32'}`}
                      controls
                      preload="metadata"
                      muted={false}
                      data-testid={`video-player-${post.id}-${index}`}
                      style={{ backgroundColor: '#000' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <img 
                    key={index}
                    src={mediaUrl} 
                    alt={`Post image ${index + 1}`} 
                    className={`w-full object-cover ${post.images!.length === 1 ? 'max-h-96' : 'h-32'}`}
                    data-testid={`img-post-${post.id}-${index}`}
                  />
                );
              })}
            </div>
          </Link>
        )}
      </div>

      {/* Post Reactions - Giống hệt trong hình */}
      <div className="px-6 py-4 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {/* 3 emoji reactions tròn giống hình */}
          <div className="flex -space-x-1">
            <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-lg">👍</span>
            </div>
            <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-lg">🐻</span>
            </div>
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-lg">😊</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span data-testid={`text-likes-count-${post.id}`}>{post.likesCount} lượt thích</span>
          <span>•</span>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="hover:text-blue-600 transition-colors duration-300"
            data-testid={`button-toggle-comments-${post.id}`}
          >
            {post.commentsCount} bình luận
          </button>
        </div>
      </div>

      {/* Post Actions - Giống hệt trong hình */}
      <div className="px-6 py-4 flex justify-around border-t border-gray-200">
        <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost"
              onClick={handleQuickLike}
              onMouseEnter={() => setShowReactionPicker(true)}
              disabled={toggleReactionMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-3 transition-all duration-200 flex-1 justify-center font-medium text-gray-600 hover:bg-gray-50 ${
                post.isLiked 
                  ? 'text-blue-600 bg-blue-50' 
                  : ''
              }`}
              data-testid={`button-like-${post.id}`}
            >
              <ThumbsUp className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>Thích</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-200" side="top">
            <div className="flex space-x-2">
              {reactionTypes.map((reaction) => {
                const IconComponent = reaction.icon;
                return (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className={`p-3 rounded-full hover:scale-110 transition-all duration-200 ${reaction.bgColor} hover:${reaction.bgColor}/80 shadow-lg`}
                    title={reaction.type}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          variant="ghost"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-all duration-200 flex-1 justify-center text-gray-600 font-medium"
          data-testid={`button-comment-${post.id}`}
        >
          <MessageCircle className="h-5 w-5" />
          <span>Bình luận</span>
        </Button>

        <Button 
          variant="ghost"
          onClick={() => setShowShareDialog(true)}
          className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-all duration-200 flex-1 justify-center text-gray-600 font-medium"
          data-testid={`button-share-${post.id}`}
        >
          <Share className="h-5 w-5" />
          <span>Chia sẻ</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4" data-testid={`comments-section-${post.id}`}>
          <div className="flex items-start space-x-4 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face" 
              alt="Your profile" 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white shadow-md"
            />
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 border-none text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                data-testid={`input-comment-${post.id}`}
              />
              {commentText && (
                <Button
                  onClick={handleComment}
                  disabled={createCommentMutation.isPending}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-1 text-sm rounded-xl"
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  Đăng
                </Button>
              )}
            </div>
          </div>
          
          {/* Existing Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3" data-testid={`comment-${comment.id}`}>
                <img 
                  src={comment.user.profileImage || "https://via.placeholder.com/32"} 
                  alt={`${comment.user.firstName} ${comment.user.lastName}`} 
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white shadow-md"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 shadow-sm">
                    <p className="font-semibold text-sm text-gray-800 mb-1" data-testid={`text-comment-author-${comment.id}`}>
                      <UserNameWithBadge 
                        firstName={comment.user.firstName}
                        lastName={comment.user.lastName}
                        badgeImageUrl={comment.user.badgeImageUrl}
                      />
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed" data-testid={`text-comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 ml-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-xs text-muted-foreground hover:underline flex items-center space-x-1" data-testid={`button-like-comment-${comment.id}`}>
                          <ThumbsUp className="h-3 w-3" />
                          <span>Thích</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" side="top">
                        <div className="flex space-x-1">
                          {reactionTypes.map((reaction) => {
                            const IconComponent = reaction.icon;
                            return (
                              <button
                                key={reaction.type}
                                className={`p-1 rounded-full hover:scale-110 transition-transform ${reaction.bgColor}`}
                                title={reaction.type}
                              >
                                <IconComponent className="h-3 w-3 text-white" />
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-xs text-muted-foreground hover:underline" 
                      data-testid={`button-reply-comment-${comment.id}`}
                    >
                      Trả lời
                    </button>
                    <span className="text-xs text-muted-foreground" data-testid={`text-comment-time-${comment.id}`}>
                      {formatTimeAgo(comment.createdAt!)}
                    </span>
                  </div>
                  
                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="flex items-start space-x-3 mt-3 ml-4">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=24&h=24&fit=crop&crop=face" 
                        alt="Your profile" 
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder={`Trả lời ${comment.user.firstName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-secondary rounded-full px-3 py-1 border-none text-sm"
                        />
                        {replyText && (
                          <Button
                            onClick={() => {
                              // TODO: Implement reply functionality
                              setReplyText("");
                              setReplyingTo(null);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-2 py-1 text-xs"
                          >
                            Trả lời
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Chia sẻ bài viết</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={shareViaLink}
              className="w-full flex items-center justify-start space-x-3 p-3 bg-secondary hover:bg-border text-foreground"
              variant="ghost"
            >
              <LinkIcon className="h-5 w-5" />
              <span>Sao chép liên kết</span>
            </Button>
            <Button
              className="w-full flex items-center justify-start space-x-3 p-3 bg-secondary hover:bg-border text-foreground"
              variant="ghost"
            >
              <Users className="h-5 w-5" />
              <span>Chia sẻ với bạn bè</span>
            </Button>
            {post.images && post.images.length > 0 && (
              <Button
                onClick={() => {
                  post.images?.forEach((image, index) => {
                    downloadWithWatermark(image, `post-${post.id}-${index + 1}.jpg`);
                  });
                  setShowShareDialog(false);
                }}
                className="w-full flex items-center justify-start space-x-3 p-3 bg-secondary hover:bg-border text-foreground"
                variant="ghost"
              >
                <Download className="h-5 w-5" />
                <span>Tải xuống với watermark</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for watermark generation */}
      <canvas ref={canvasRef} className="hidden" />
    </article>
  );
}
