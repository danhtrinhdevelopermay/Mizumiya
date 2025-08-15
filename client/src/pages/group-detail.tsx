import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Lock, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/layout";
import { Link } from "wouter";

interface Group {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  privacy: 'public' | 'private' | 'secret';
  memberCount: number;
  isJoined: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export default function GroupDetail() {
  const [match, params] = useRoute("/group/:groupId");
  const groupId = params?.groupId;

  // Mock data for now - replace with actual API call
  const mockGroup: Group = {
    id: groupId || '',
    name: 'Sample Group',
    description: 'This is a sample group description. Join us to connect with like-minded people and share interesting content.',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&w=800&h=300&fit=crop',
    privacy: 'public',
    memberCount: 1247,
    isJoined: false,
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };

  const { data: group = mockGroup, isLoading, error } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId,
    initialData: mockGroup,
  });

  if (!match || !groupId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Group not found</h1>
            <Link href="/groups">
              <Button>Go back to groups</Button>
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
            <div className="bg-white rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const getPrivacyIcon = () => {
    switch (group.privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'secret':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPrivacyText = () => {
    switch (group.privacy) {
      case 'public':
        return 'Public group';
      case 'private':
        return 'Private group';
      case 'secret':
        return 'Secret group';
      default:
        return 'Public group';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center">
            <Link href="/groups">
              <Button variant="ghost" size="sm" className="mr-3">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">{group.name}</h1>
          </div>
          {group.isAdmin && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>

        {/* Cover Photo */}
        <div className="relative h-64 bg-gradient-to-r from-blue-400 to-purple-500">
          {group.coverImage && (
            <img
              src={group.coverImage}
              alt="Group cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Group Info */}
        <div className="bg-white px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  {getPrivacyIcon()}
                  <span className="text-sm">{getPrivacyText()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{group.memberCount.toLocaleString()} members</span>
                </div>
              </div>

              {group.description && (
                <p className="text-gray-700 max-w-3xl leading-relaxed">{group.description}</p>
              )}
            </div>

            <div className="flex space-x-3">
              {group.isJoined ? (
                <>
                  <Button variant="outline">Joined</Button>
                  <Button>Share</Button>
                </>
              ) : (
                <>
                  <Button>Join Group</Button>
                  <Button variant="outline">Share</Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="px-6">
            <nav className="flex space-x-8">
              <button className="py-4 border-b-2 border-blue-500 text-blue-600 font-medium">
                Discussion
              </button>
              <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Members
              </button>
              <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Events
              </button>
              <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Photos
              </button>
              <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Files
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            {group.isJoined && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
                    alt="Your profile"
                    className="w-10 h-10 rounded-full"
                  />
                  <button className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-left text-gray-500 hover:bg-gray-200 transition-colors">
                    Write something to this group...
                  </button>
                </div>
              </div>
            )}

            {/* Posts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
              <div className="text-center text-gray-500 py-8">
                <p>No posts yet. Be the first to share something!</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">About</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  {getPrivacyIcon()}
                  <span>{getPrivacyText()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount.toLocaleString()} members</span>
                </div>
                <div>
                  <span>Created {new Date(group.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>

            {/* Recent Members */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Recent Members</h3>
              <div className="text-center text-gray-500 py-4">
                <p>Member list will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}