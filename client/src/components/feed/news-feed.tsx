import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Post from "./post";
import type { PostWithUser, CommentWithUser } from "@shared/schema";

// Separate component to handle individual post with comments
function PostWithComments({ post }: { post: PostWithUser }) {
  const { data: comments = [] } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/posts", post.id, "comments"],
  });

  return <Post post={post} comments={comments} />;
}

export default function NewsFeed() {
  const { data: posts = [], isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts/feed"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="kawaii-card p-6 animate-kawaii-pulse relative">
            {/* Kawaii loading decorations */}
            <div className="absolute top-3 right-3 text-kawaii-pink-300 animate-bounce-gentle">🌸</div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-kawaii-pink-300 to-kawaii-purple-300 rounded-full animate-float"></div>
              <div>
                <div className="w-28 h-6 bg-gradient-to-r from-kawaii-pink-200 to-kawaii-purple-200 rounded-2xl mb-2 animate-kawaii-pulse"></div>
                <div className="w-20 h-4 bg-gradient-to-r from-kawaii-mint-200 to-kawaii-blue-200 rounded-xl animate-kawaii-pulse"></div>
              </div>
            </div>
            <div className="w-full h-40 bg-gradient-to-br from-kawaii-pink-100 to-kawaii-purple-100 rounded-2xl mb-4 animate-kawaii-pulse"></div>
            <div className="flex justify-around">
              <div className="w-24 h-12 bg-gradient-to-r from-kawaii-pink-200 to-kawaii-purple-200 rounded-2xl animate-kawaii-pulse"></div>
              <div className="w-24 h-12 bg-gradient-to-r from-kawaii-blue-200 to-kawaii-mint-200 rounded-2xl animate-kawaii-pulse"></div>
              <div className="w-24 h-12 bg-gradient-to-r from-kawaii-peach-200 to-kawaii-pink-200 rounded-2xl animate-kawaii-pulse"></div>
            </div>
            
            {/* Cute loading text */}
            <div className="text-center mt-4">
              <p className="text-kawaii-purple-400 font-cute text-sm animate-bounce-gentle">
                Đang tải những khoảnh khắc đẹp... 🎀
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="news-feed">
      {posts.map((post) => (
        <PostWithComments 
          key={post.id} 
          post={post} 
        />
      ))}
      
      {/* Kawaii Load More */}
      <div className="text-center py-8">
        <Button 
          variant="outline"
          className="kawaii-btn px-8 py-4 text-lg font-kawaii font-bold relative overflow-hidden group"
          data-testid="button-load-more"
        >
          <span className="relative z-10">🌟 Tải thêm điều thú vị 🌟</span>
          <div className="absolute inset-0 bg-gradient-to-r from-kawaii-pink-200 to-kawaii-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Button>
        <p className="text-kawaii-purple-400 font-cute text-sm mt-2 animate-bounce-gentle">
          Còn nhiều bài viết dễ thương khác nữa đây! ✨
        </p>
      </div>
    </div>
  );
}
