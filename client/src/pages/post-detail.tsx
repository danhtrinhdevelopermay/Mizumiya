import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/layout";
import Post from "@/components/feed/post";
import { Link } from "wouter";
import type { PostWithUser, CommentWithUser } from "@shared/schema";

export default function PostDetail() {
  const [match, params] = useRoute("/post/:postId");
  const postId = params?.postId;

  const { data: post, isLoading: isLoadingPost, error: postError } = useQuery<PostWithUser>({
    queryKey: ["/api/posts", postId],
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/posts", postId, "comments"],
    enabled: !!postId,
  });

  if (!match || !postId) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Post not found</h1>
            <Link href="/">
              <Button>Go back to home</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoadingPost) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (postError || !post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Post not found</h1>
            <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been removed.</p>
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
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center p-4 border-b bg-white">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            Post by {post.user.firstName} {post.user.lastName}
          </h1>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <Post post={post} comments={comments} />
        </div>

        {/* Related Posts Section */}
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">More from {post.user.firstName}</h2>
            <div className="text-center text-gray-500 py-4">
              <p>More posts will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}