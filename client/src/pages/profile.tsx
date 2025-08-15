import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Edit, MapPin, Calendar, Briefcase, Heart } from "lucide-react";
import type { User, PostWithUser } from "@shared/schema";
import EditProfileModal from "@/components/profile/edit-profile-modal";
import ImageUploadModal from "@/components/profile/image-upload-modal";

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false);
  const [isCoverUploadOpen, setIsCoverUploadOpen] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: userPosts = [] } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts/user"],
  });

  const { data: friendsCount } = useQuery<{ count: number }>({
    queryKey: ["/api/friends/count"],
  });

  if (!user) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Cover Photo */}
      <div className="relative h-64 rounded-lg mb-4 overflow-hidden">
        {user.coverImage ? (
          <img 
            src={user.coverImage} 
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
        )}
        <button 
          onClick={() => setIsCoverUploadOpen(true)}
          className="absolute bottom-4 right-4 bg-white text-foreground px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
        >
          <Camera className="h-4 w-4" />
          <span>Edit cover photo</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 -mt-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
          <div className="relative">
            <img 
              src={user.profileImage || "/api/placeholder/150"} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-32 h-32 rounded-full border-4 border-white bg-gray-200"
            />
            <button 
              onClick={() => setIsAvatarUploadOpen(true)}
              className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full hover:bg-primary"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {user.firstName} {user.lastName}
            </h1>
            {user.bio && (
              <p className="text-muted-foreground mb-2">{user.bio}</p>
            )}
            {user.location && (
              <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.workplace && (
              <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                <span>{user.workplace}</span>
              </div>
            )}
            <p className="text-muted-foreground">
              {friendsCount ? `${friendsCount.count} friends` : "0 friends"}
            </p>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* About */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
          <div className="space-y-3">
            {user.workplace ? (
              <div className="flex items-center space-x-3 text-foreground">
                <Briefcase className="h-5 w-5" />
                <span>{user.workplace}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Briefcase className="h-5 w-5" />
                <span>Add work experience</span>
              </div>
            )}
            
            {user.location ? (
              <div className="flex items-center space-x-3 text-foreground">
                <MapPin className="h-5 w-5" />
                <span>{user.location}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>Add location</span>
              </div>
            )}
            
            {user.relationshipStatus ? (
              <div className="flex items-center space-x-3 text-foreground">
                <Heart className="h-5 w-5" />
                <span>{user.relationshipStatus}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Heart className="h-5 w-5" />
                <span>Add relationship status</span>
              </div>
            )}
            
            {user.dateOfBirth ? (
              <div className="flex items-center space-x-3 text-foreground">
                <Calendar className="h-5 w-5" />
                <span>{new Date(user.dateOfBirth).toLocaleDateString()}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>Add birthday</span>
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Posts List */}
          {userPosts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-muted-foreground">No posts yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Share your first post to get started
              </p>
            </div>
          ) : (
            userPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={post.user.profileImage || "/api/placeholder/40"} 
                    alt={`${post.user.firstName} ${post.user.lastName}`}
                    className="w-10 h-10 rounded-full bg-gray-200"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {post.user.firstName} {post.user.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <p className="text-foreground mb-4">{post.content}</p>
                
                {post.images && post.images.length > 0 && (
                  <div className="mb-4">
                    <img 
                      src={post.images[0]} 
                      alt="Post content"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground border-t pt-3">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Image Upload Modals */}
      <ImageUploadModal
        isOpen={isAvatarUploadOpen}
        onClose={() => setIsAvatarUploadOpen(false)}
        type="avatar"
      />
      
      <ImageUploadModal
        isOpen={isCoverUploadOpen}
        onClose={() => setIsCoverUploadOpen(false)}
        type="cover"
      />
    </div>
  );
}