import crypto from 'crypto';
import { 
  users,
  posts,
  comments,
  likes,
  friendships,
  stories,
  storyComments,
  storyReactions,
  conversations,
  messages,
  notifications,
  type User, 
  type InsertUser, 
  type SignUpUser,
  type SignInUser,
  type UpdateProfile,
  type Post, 
  type InsertPost,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Friendship,
  type InsertFriendship,
  type Story,
  type InsertStory,
  type StoryComment,
  type InsertStoryComment,
  type StoryReaction,
  type InsertStoryReaction,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type PostWithUser,
  type CommentWithUser,
  type StoryWithUser,
  type StoryCommentWithUser,
  type StoryReactionWithUser,
  type UserWithFriendshipStatus,
  type NotificationWithUser
} from "@shared/schema";
import { 
  beautyContestants, 
  beautyVotes, 
  userDailyVotes,
  type BeautyContestant,
  type BeautyVote,
  type UserDailyVotes
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, ne, lt, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Authentication
  createUser(user: SignUpUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: string, updates: UpdateProfile): Promise<User | undefined>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: string): Promise<Post | undefined>;
  getUserPosts(userId: string): Promise<PostWithUser[]>;
  getFeedPosts(userId: string, limit?: number): Promise<PostWithUser[]>;
  deletePost(id: string): Promise<boolean>;
  
  // Likes
  toggleLike(like: InsertLike): Promise<{ liked: boolean; likesCount: number }>;
  getPostLikes(postId: string): Promise<Like[]>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<CommentWithUser[]>;
  
  // Friends
  sendFriendRequest(friendship: InsertFriendship): Promise<Friendship>;
  respondToFriendRequest(friendshipId: string, status: string): Promise<Friendship | undefined>;
  getFriendRequests(userId: string): Promise<UserWithFriendshipStatus[]>;
  getFriends(userId: string): Promise<User[]>;
  getOnlineFriends(userId: string): Promise<User[]>;
  getFriendsCount(userId: string): Promise<number>;
  
  // User search and profiles
  searchUsers(query: string, currentUserId: string): Promise<UserWithFriendshipStatus[]>;
  getUserWithFriendshipStatus(userId: string, currentUserId: string): Promise<UserWithFriendshipStatus | undefined>;
  updateUserProfile(userId: string, updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    workplace?: string;
    relationshipStatus?: string;
    dateOfBirth?: string;
    profileImage?: string;
    coverImage?: string;
  }): Promise<User>;
  
  // Stories
  createStory(story: InsertStory): Promise<Story>;
  getUserStories(userId: string): Promise<StoryWithUser[]>;
  getFriendsStories(userId: string): Promise<StoryWithUser[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<NotificationWithUser[]>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  deleteNotification(notificationId: string): Promise<boolean>;
  
  // Admin
  getAllUsers(): Promise<User[]>;
  resetUserPassword(userId: string, newPassword: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;

  // Beauty Contest
  getBeautyContestants(): Promise<BeautyContestant[]>;
  voteForContestant(userId: string, contestantId: string): Promise<boolean>;
  getUserDailyVotes(userId: string, date: string): Promise<UserDailyVotes | null>;
  getRemainingVotes(userId: string): Promise<number>;
  
  // Beauty Contest Admin
  updateContestant(contestantId: string, updates: { name?: string; country?: string; avatar?: string }): Promise<BeautyContestant | null>;
  getContestantVotes(contestantId: string): Promise<Array<{ user: User; voteDate: string }>>;
  getAllContestantVotes(): Promise<Array<{ contestant: BeautyContestant; votes: Array<{ user: User; voteDate: string }> }>>;
  createContestant(data: { name: string; country: string; avatar: string }): Promise<BeautyContestant>;
  deleteContestant(contestantId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Authentication methods
  async createUser(userData: SignUpUser): Promise<User> {
    // First check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const existingUsername = await this.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username is already taken');
    }

    // Generate a single UUID for this user to use across all databases
    const userId = crypto.randomUUID();
    
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        phoneNumber: userData.phoneNumber,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        workplace: userData.workplace,
        education: userData.education,
        relationshipStatus: userData.relationshipStatus,
        profileImage: userData.profileImage,
        coverImage: userData.coverImage,
        isOnline: false,
        isEmailVerified: false,
      })
      .returning();
    
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return null;

    // Direct password comparison (plain text - WARNING: Security risk)
    if (password !== user.password) return null;

    // Update last seen and online status
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isOnline: true, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return user;
  }

  async updateUser(id: string, updates: UpdateProfile): Promise<User | undefined> {
    // Handle date conversion for dateOfBirth
    const processedUpdates = { ...updates } as any;
    if (processedUpdates.dateOfBirth && typeof processedUpdates.dateOfBirth === 'string') {
      processedUpdates.dateOfBirth = new Date(processedUpdates.dateOfBirth);
    }

    const [user] = await db
      .update(users)
      .set(processedUpdates)
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  // Post methods
  async createPost(postData: InsertPost): Promise<Post> {
    // Generate a single UUID for this post to use across all databases
    const postId = crypto.randomUUID();
    
    const [post] = await db
      .insert(posts)
      .values({
        ...postData,
        id: postId,
        images: postData.images ? postData.images as string[] : [],
        hashtags: postData.hashtags ? postData.hashtags as string[] : [],
        videoLabels: postData.videoLabels ? postData.videoLabels as string[] : [],
      })
      .returning();
    
    return post;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    
    return post;
  }

  async getPostById(id: string): Promise<PostWithUser | undefined> {
    const [post] = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        images: posts.images,
        type: posts.type,
        visibility: posts.visibility,
        title: posts.title,
        description: posts.description,
        location: posts.location,
        category: posts.category,
        hashtags: posts.hashtags,
        coverImage: posts.coverImage,
        videoLabels: posts.videoLabels,
        musicTrack: posts.musicTrack,
        commentsEnabled: posts.commentsEnabled,
        downloadEnabled: posts.downloadEnabled,
        trimStart: posts.trimStart,
        trimEnd: posts.trimEnd,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          bio: users.bio,
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) return undefined;

    return {
      ...post,
      user: post.user as User,
      isLiked: false,
    };
  }

  async getUserPosts(userId: string): Promise<PostWithUser[]> {

    const userPosts = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        images: posts.images,
        type: posts.type,
        visibility: posts.visibility,
        title: posts.title,
        description: posts.description,
        location: posts.location,
        category: posts.category,
        hashtags: posts.hashtags,
        coverImage: posts.coverImage,
        videoLabels: posts.videoLabels,
        musicTrack: posts.musicTrack,
        commentsEnabled: posts.commentsEnabled,
        downloadEnabled: posts.downloadEnabled,
        trimStart: posts.trimStart,
        trimEnd: posts.trimEnd,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          bio: users.bio,
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));

    return userPosts.map(post => ({
      ...post,
      user: post.user as User,
      isLiked: false,
    }));
  }

  async getFeedPosts(userId: string, limit = 10): Promise<PostWithUser[]> {
    try {
      // Get user's friends first
      const friends = await this.getFriends(userId);
      const friendIds = friends.map(f => f.id);
      
      let feedPosts: any[] = [];

      if (friendIds.length > 0) {
        // Friends' posts (prioritized) - get more from friends
        const friendsPostsLimit = Math.ceil(limit * 0.7); // 70% from friends
        const friendConditions = friendIds.map(id => eq(posts.userId, id));
        
        const friendsPosts = await db
          .select({
            id: posts.id,
            userId: posts.userId,
            content: posts.content,
            images: posts.images,
            type: posts.type,
            visibility: posts.visibility,
            title: posts.title,
            description: posts.description,
            location: posts.location,
            category: posts.category,
            hashtags: posts.hashtags,
            coverImage: posts.coverImage,
            videoLabels: posts.videoLabels,
            musicTrack: posts.musicTrack,
            commentsEnabled: posts.commentsEnabled,
            downloadEnabled: posts.downloadEnabled,
            trimStart: posts.trimStart,
            trimEnd: posts.trimEnd,
            likesCount: posts.likesCount,
            commentsCount: posts.commentsCount,
            sharesCount: posts.sharesCount,
            createdAt: posts.createdAt,
            isFriend: sql<boolean>`true`.as('isFriend'),
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImage: users.profileImage,
              bio: users.bio,
            }
          })
          .from(posts)
          .innerJoin(users, eq(posts.userId, users.id))
          .where(or(...friendConditions))
          .orderBy(desc(posts.createdAt))
          .limit(friendsPostsLimit);

        feedPosts.push(...friendsPosts);

        // User's own posts - get remaining slots
        const userPostsLimit = limit - friendsPosts.length;
        if (userPostsLimit > 0) {
          const userPosts = await db
            .select({
              id: posts.id,
              userId: posts.userId,
              content: posts.content,
              images: posts.images,
              type: posts.type,
              visibility: posts.visibility,
              title: posts.title,
              description: posts.description,
              location: posts.location,
              category: posts.category,
              hashtags: posts.hashtags,
              coverImage: posts.coverImage,
              videoLabels: posts.videoLabels,
              musicTrack: posts.musicTrack,
              commentsEnabled: posts.commentsEnabled,
              downloadEnabled: posts.downloadEnabled,
              trimStart: posts.trimStart,
              trimEnd: posts.trimEnd,
              likesCount: posts.likesCount,
              commentsCount: posts.commentsCount,
              sharesCount: posts.sharesCount,
              createdAt: posts.createdAt,
              isFriend: sql<boolean>`false`.as('isFriend'),
              user: {
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImage: users.profileImage,
                bio: users.bio,
              }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.createdAt))
            .limit(userPostsLimit);

          feedPosts.push(...userPosts);
        }
      } else {
        // No friends, get user's own posts plus public posts from all users
        const userPosts = await db
          .select({
            id: posts.id,
            userId: posts.userId,
            content: posts.content,
            images: posts.images,
            type: posts.type,
            visibility: posts.visibility,
            title: posts.title,
            description: posts.description,
            location: posts.location,
            category: posts.category,
            hashtags: posts.hashtags,
            coverImage: posts.coverImage,
            videoLabels: posts.videoLabels,
            musicTrack: posts.musicTrack,
            commentsEnabled: posts.commentsEnabled,
            downloadEnabled: posts.downloadEnabled,
            trimStart: posts.trimStart,
            trimEnd: posts.trimEnd,
            likesCount: posts.likesCount,
            commentsCount: posts.commentsCount,
            sharesCount: posts.sharesCount,
            createdAt: posts.createdAt,
            isFriend: sql<boolean>`false`.as('isFriend'),
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImage: users.profileImage,
              bio: users.bio,
            }
          })
          .from(posts)
          .innerJoin(users, eq(posts.userId, users.id))
          .where(eq(posts.userId, userId))
          .orderBy(desc(posts.createdAt))
          .limit(Math.ceil(limit * 0.3)); // 30% for user's own posts

        // Get public posts from other users
        const publicPosts = await db
          .select({
            id: posts.id,
            userId: posts.userId,
            content: posts.content,
            images: posts.images,
            type: posts.type,
            visibility: posts.visibility,
            title: posts.title,
            description: posts.description,
            location: posts.location,
            category: posts.category,
            hashtags: posts.hashtags,
            coverImage: posts.coverImage,
            videoLabels: posts.videoLabels,
            musicTrack: posts.musicTrack,
            commentsEnabled: posts.commentsEnabled,
            downloadEnabled: posts.downloadEnabled,
            trimStart: posts.trimStart,
            trimEnd: posts.trimEnd,
            likesCount: posts.likesCount,
            commentsCount: posts.commentsCount,
            sharesCount: posts.sharesCount,
            createdAt: posts.createdAt,
            isFriend: sql<boolean>`false`.as('isFriend'),
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImage: users.profileImage,
              bio: users.bio,
            }
          })
          .from(posts)
          .innerJoin(users, eq(posts.userId, users.id))
          .where(and(
            eq(posts.visibility, 'public'),
            sql`${posts.userId} != ${userId}` // Exclude current user's posts
          ))
          .orderBy(desc(posts.createdAt))
          .limit(limit - userPosts.length);

        feedPosts = [...userPosts, ...publicPosts];
      }

      // Sort all posts: friends' posts first (by isFriend), then by date
      feedPosts.sort((a, b) => {
        if (a.isFriend && !b.isFriend) return -1;
        if (!a.isFriend && b.isFriend) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Check if user has liked each post
      return Promise.all(feedPosts.map(async post => {
        const [userLike] = await db
          .select()
          .from(likes)
          .where(and(eq(likes.postId, post.id), eq(likes.userId, userId)))
          .limit(1);

        return {
          ...post,
          user: post.user as User,
          userLike,
          isLiked: !!userLike,
        };
      }));
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Like methods
  async toggleLike(likeData: InsertLike): Promise<{ liked: boolean; likesCount: number }> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, likeData.postId), eq(likes.userId, likeData.userId)))
      .limit(1);

    if (existingLike) {
      // Unlike
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      
      const [post] = await db
        .update(posts)
        .set({ likesCount: sql`${posts.likesCount} - 1` })
        .where(eq(posts.id, likeData.postId))
        .returning();

      return { liked: false, likesCount: post.likesCount || 0 };
    } else {
      // Like
      await db.insert(likes).values(likeData);
      
      const [post] = await db
        .update(posts)
        .set({ likesCount: sql`${posts.likesCount} + 1` })
        .where(eq(posts.id, likeData.postId))
        .returning();

      return { liked: true, likesCount: post.likesCount || 0 };
    }
  }

  async getPostLikes(postId: string): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }

  // Comment methods
  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    
    // Update post comment count
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, commentData.postId));
    
    return comment;
  }

  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const postComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          bio: users.bio,
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    return postComments.map(comment => ({
      ...comment,
      user: comment.user as User,
    }));
  }

  // Friend methods
  async sendFriendRequest(friendshipData: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        ...friendshipData,
        status: "pending",
      })
      .returning();
    
    return friendship;
  }

  async respondToFriendRequest(friendshipId: string, status: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status })
      .where(eq(friendships.id, friendshipId))
      .returning();
    
    return friendship;
  }

  async getFriendRequests(userId: string): Promise<any[]> {
    const requests = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        bio: users.bio,
        friendshipStatus: friendships.status,
        friendshipId: friendships.id,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.requesterId, users.id))
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));

    return requests;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendsResult = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        bio: users.bio,
        isOnline: users.isOnline,
      })
      .from(friendships)
      .innerJoin(users, or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, users.id)),
        and(eq(friendships.addresseeId, userId), eq(friendships.requesterId, users.id))
      ))
      .where(eq(friendships.status, "accepted"));

    return friendsResult as User[];
  }

  async getOnlineFriends(userId: string): Promise<User[]> {
    // First, cleanup users who haven't been seen in more than 2 minutes
    await this.cleanupInactiveUsers();
    
    const friends = await this.getFriends(userId);
    return friends.filter(friend => friend.isOnline);
  }

  async cleanupInactiveUsers(): Promise<void> {
    // Set users as offline if they haven't been seen in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    await db
      .update(users)
      .set({ isOnline: false })
      .where(and(
        eq(users.isOnline, true),
        sql`${users.lastSeen} < ${twoMinutesAgo}`
      ));
  }

  async setUserOffline(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline: false, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserOnlineStatus(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline: true, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getFriendsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          ),
          eq(friendships.status, "accepted")
        )
      );

    return result[0]?.count || 0;
  }

  async updateUserProfile(userId: string, updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    workplace?: string;
    relationshipStatus?: string;
    dateOfBirth?: string;
    profileImage?: string;
    coverImage?: string;
  }): Promise<User> {
    // Convert dateOfBirth string to Date if provided
    const updateData: any = { ...updates };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

  // Story methods
  async createStory(storyData: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(storyData)
      .returning();
    
    return story;
  }

  async getUserStories(userId: string): Promise<StoryWithUser[]> {
    const userStories = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        content: stories.content,
        image: stories.image,
        expiresAt: stories.expiresAt,
        createdAt: stories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));

    return userStories.map(story => ({
      ...story,
      user: story.user as User,
    }));
  }

  async getFriendsStories(userId: string): Promise<StoryWithUser[]> {
    console.log('=== getFriendsStories DEBUG ===');
    console.log('User ID:', userId);
    
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.id);
    console.log('Friends count:', friends.length);
    console.log('Friend IDs:', friendIds);
    
    // Include the current user's stories as well
    const allUserIds = [userId, ...friendIds];
    console.log('All user IDs to query:', allUserIds);

    const allStories = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        content: stories.content,
        image: stories.image,
        expiresAt: stories.expiresAt,
        createdAt: stories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(and(
        or(...allUserIds.map(id => eq(stories.userId, id))),
        // Only non-expired stories (24 hours)
        sql`${stories.expiresAt} > now()`
      ))
      .orderBy(desc(stories.createdAt));

    console.log('Stories found:', allStories.length);
    console.log('Stories data:', allStories);

    const result = allStories.map(story => ({
      ...story,
      user: story.user as User,
    }));
    
    console.log('=== END getFriendsStories DEBUG ===');
    return result;
  }

  async getStoryById(storyId: string, userId: string): Promise<StoryWithUser | null> {
    // Check if user has permission to view this story (must be friends with owner or be the owner)
    const [story] = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        content: stories.content,
        image: stories.image,
        expiresAt: stories.expiresAt,
        createdAt: stories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(and(
        eq(stories.id, storyId),
        // Only non-expired stories
        sql`${stories.expiresAt} > now()`
      ));

    if (!story) return null;

    // Check if user has permission to view this story
    if (story.userId === userId) {
      // Owner can always view their own story
      return {
        ...story,
        user: story.user as User,
      };
    }

    // Check if user is friends with story owner
    const friendshipResults = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, story.userId)),
          and(eq(friendships.requesterId, story.userId), eq(friendships.addresseeId, userId))
        )
      );

    const friendship = friendshipResults[0];
    if (!friendship || friendship.status !== 'accepted') {
      return null; // Not friends, cannot view story
    }

    return {
      ...story,
      user: story.user as User,
    };
  }

  async deleteStory(storyId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(stories)
      .where(and(
        eq(stories.id, storyId),
        eq(stories.userId, userId) // Only owner can delete
      ));

    return (result.rowCount || 0) > 0;
  }

  async addStoryComment(storyId: string, userId: string, content: string): Promise<StoryCommentWithUser> {
    // Check if user has permission to comment (must be friends with story owner or be the owner)
    const story = await this.getStoryById(storyId, userId);
    if (!story) {
      throw new Error('Story not found or you do not have permission to comment');
    }

    const [comment] = await db
      .insert(storyComments)
      .values({
        storyId,
        userId,
        content,
      })
      .returning();

    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    return {
      ...comment,
      user,
    };
  }

  async getStoryComments(storyId: string): Promise<StoryCommentWithUser[]> {
    const comments = await db
      .select({
        id: storyComments.id,
        storyId: storyComments.storyId,
        userId: storyComments.userId,
        content: storyComments.content,
        createdAt: storyComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(storyComments)
      .innerJoin(users, eq(storyComments.userId, users.id))
      .where(eq(storyComments.storyId, storyId))
      .orderBy(asc(storyComments.createdAt));

    return comments.map(comment => ({
      ...comment,
      user: comment.user as User,
    }));
  }

  async toggleStoryReaction(storyId: string, userId: string, type: string): Promise<StoryReactionWithUser | null> {
    // Check if user has permission to react (must be friends with story owner or be the owner)
    const story = await this.getStoryById(storyId, userId);
    if (!story) {
      throw new Error('Story not found or you do not have permission to react');
    }

    // Check if user already reacted
    const [existingReaction] = await db
      .select()
      .from(storyReactions)
      .where(and(
        eq(storyReactions.storyId, storyId),
        eq(storyReactions.userId, userId)
      ));

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Same reaction type - remove it
        await db
          .delete(storyReactions)
          .where(eq(storyReactions.id, existingReaction.id));
        return null;
      } else {
        // Different reaction type - update it
        const [updatedReaction] = await db
          .update(storyReactions)
          .set({ type })
          .where(eq(storyReactions.id, existingReaction.id))
          .returning();

        const user = await this.getUserById(userId);
        if (!user) throw new Error('User not found');

        return {
          ...updatedReaction,
          user,
        };
      }
    } else {
      // No existing reaction - create new one
      const [newReaction] = await db
        .insert(storyReactions)
        .values({
          storyId,
          userId,
          type,
        })
        .returning();

      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      return {
        ...newReaction,
        user,
      };
    }
  }

  async getStoryReactions(storyId: string): Promise<StoryReactionWithUser[]> {
    const reactions = await db
      .select({
        id: storyReactions.id,
        storyId: storyReactions.storyId,
        userId: storyReactions.userId,
        type: storyReactions.type,
        createdAt: storyReactions.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(storyReactions)
      .innerJoin(users, eq(storyReactions.userId, users.id))
      .where(eq(storyReactions.storyId, storyId))
      .orderBy(desc(storyReactions.createdAt));

    return reactions.map(reaction => ({
      ...reaction,
      user: reaction.user as User,
    }));
  }

  // Search and profile methods
  async searchUsers(query: string, currentUserId: string): Promise<UserWithFriendshipStatus[]> {
    console.log('=== SearchUsers DEBUG ===');
    console.log('Query:', query);
    console.log('CurrentUserId:', currentUserId);
    
    const searchQuery = `%${query.toLowerCase()}%`;
    console.log('SearchQuery pattern:', searchQuery);
    
    try {
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          bio: users.bio,
          isOnline: users.isOnline,
        })
        .from(users)
        .where(
          and(
            or(
              sql`LOWER(${users.username}) LIKE ${searchQuery}`,
              sql`LOWER(${users.firstName}) LIKE ${searchQuery}`,
              sql`LOWER(${users.lastName}) LIKE ${searchQuery}`,
              sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE ${searchQuery}`
            ),
            sql`${users.id} != ${currentUserId}` // Exclude current user
          )
        )
        .limit(20);

      console.log('Raw search results:', JSON.stringify(searchResults, null, 2));
      console.log('Search results count:', searchResults.length);

      // Get friendship status for each user
      const finalResults = await Promise.all(searchResults.map(async (user) => {
        const friendship = await this.getFriendshipStatus(user.id, currentUserId);
        return {
          ...user,
          friendshipStatus: friendship?.status,
          mutualFriendsCount: 0, // Could be calculated later if needed
        } as UserWithFriendshipStatus;
      }));

      console.log('Final results with friendship status:', finalResults.length);
      console.log('=== END SearchUsers DEBUG ===');
      
      return finalResults;
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw error;
    }
  }

  async getUserWithFriendshipStatus(userId: string, currentUserId: string): Promise<UserWithFriendshipStatus | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return undefined;

    const friendship = await this.getFriendshipStatus(userId, currentUserId);
    const friendsCount = await this.getFriendsCount(userId);

    return {
      ...user,
      friendshipStatus: friendship?.status || undefined,
      mutualFriendsCount: friendsCount,
    } as UserWithFriendshipStatus;
  }

  private async getFriendshipStatus(userId: string, currentUserId: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, currentUserId), eq(friendships.addresseeId, userId)),
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, currentUserId))
        )
      )
      .limit(1);

    return friendship;
  }

  // Notifications methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return newNotification;
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<NotificationWithUser[]> {
    const userNotifications = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        category: notifications.category,
        title: notifications.title,
        message: notifications.message,
        relatedUserId: notifications.relatedUserId,
        relatedPostId: notifications.relatedPostId,
        relatedCommentId: notifications.relatedCommentId,
        relatedGroupId: notifications.relatedGroupId,
        relatedEventId: notifications.relatedEventId,
        isRead: notifications.isRead,
        actionUrl: notifications.actionUrl,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        relatedUser: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.relatedUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return userNotifications.map(notification => ({
      ...notification,
      relatedUser: notification.relatedUser?.id ? notification.relatedUser as User : undefined,
    }));
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    
    return (result.rowCount ?? 0) > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result[0]?.count || 0;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Helper methods for creating specific notification types
  async createLikeNotification(
    userId: string, 
    postOwnerId: string, 
    postId: string, 
    likeType: string = 'like'
  ): Promise<void> {
    if (userId === postOwnerId) return; // Don't notify self

    const [liker] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!liker) return;

    const reactionEmoji = {
      'like': '👍',
      'love': '❤️', 
      'laugh': '😂',
      'angry': '😠',
      'sad': '😢'
    }[likeType] || '👍';

    await this.createNotification({
      userId: postOwnerId,
      type: 'content_interaction',
      category: 'like',
      title: 'New reaction to your post',
      message: `${liker.firstName} ${liker.lastName} reacted ${reactionEmoji} to your post`,
      relatedUserId: userId,
      relatedPostId: postId,
      actionUrl: `/post/${postId}`,
      metadata: { reactionType: likeType }
    });
  }

  async createCommentNotification(
    commenterId: string,
    postOwnerId: string, 
    postId: string,
    commentContent: string
  ): Promise<void> {
    if (commenterId === postOwnerId) return; // Don't notify self

    const [commenter] = await db.select().from(users).where(eq(users.id, commenterId)).limit(1);
    if (!commenter) return;

    await this.createNotification({
      userId: postOwnerId,
      type: 'content_interaction',
      category: 'comment',
      title: 'New comment on your post',
      message: `${commenter.firstName} ${commenter.lastName} commented on your post`,
      relatedUserId: commenterId,
      relatedPostId: postId,
      actionUrl: `/post/${postId}`,
      metadata: { commentPreview: commentContent.substring(0, 50) }
    });
  }

  async createFriendRequestNotification(
    requesterId: string,
    addresseeId: string
  ): Promise<void> {
    const [requester] = await db.select().from(users).where(eq(users.id, requesterId)).limit(1);
    if (!requester) return;

    await this.createNotification({
      userId: addresseeId,
      type: 'connection',
      category: 'friend_request',
      title: 'Friend request received',
      message: `${requester.firstName} ${requester.lastName} sent you a friend request`,
      relatedUserId: requesterId,
      actionUrl: `/user/${requesterId}`,
      metadata: { requestType: 'new' }
    });
  }

  async createFriendAcceptNotification(
    accepterId: string,
    requesterId: string
  ): Promise<void> {
    const [accepter] = await db.select().from(users).where(eq(users.id, accepterId)).limit(1);
    if (!accepter) return;

    await this.createNotification({
      userId: requesterId,
      type: 'connection',
      category: 'friend_accept',
      title: 'Friend request accepted',
      message: `${accepter.firstName} ${accepter.lastName} accepted your friend request`,
      relatedUserId: accepterId,
      actionUrl: `/user/${accepterId}`,
      metadata: { connectionType: 'accepted' }
    });
  }

  async createFriendDeclineNotification(
    declinerId: string,
    requesterId: string
  ): Promise<void> {
    const [decliner] = await db.select().from(users).where(eq(users.id, declinerId)).limit(1);
    if (!decliner) return;

    await this.createNotification({
      userId: requesterId,
      type: 'connection',
      category: 'friend_decline',
      title: 'Friend request declined',
      message: `${decliner.firstName} ${decliner.lastName} declined your friend request`,
      relatedUserId: declinerId,
      actionUrl: `/user/${declinerId}`,
      metadata: { connectionType: 'declined' }
    });
  }

  async createNewPostNotification(
    posterId: string,
    postId: string,
    postContent: string
  ): Promise<void> {
    const [poster] = await db.select().from(users).where(eq(users.id, posterId)).limit(1);
    if (!poster) return;

    // Get friends to notify
    const friends = await this.getFriends(posterId);
    
    // Create notifications for each friend
    const notificationData = friends.map(friend => ({
      userId: friend.id,
      type: 'friend_activity',
      category: 'new_post',
      title: 'Friend posted',
      message: `${poster.firstName} ${poster.lastName} shared a new post`,
      relatedUserId: posterId,
      relatedPostId: postId,
      actionUrl: `/post/${postId}`,
      metadata: { postPreview: postContent.substring(0, 50) }
    }));

    // Batch insert notifications
    if (notificationData.length > 0) {
      await db.insert(notifications).values(notificationData);
    }
  }

  // === Chat methods ===
  async createOrGetConversation(participant1Id: string, participant2Id: string): Promise<any> {
    // Check if conversation already exists
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, participant1Id),
            eq(conversations.participant2Id, participant2Id)
          ),
          and(
            eq(conversations.participant1Id, participant2Id),
            eq(conversations.participant2Id, participant1Id)
          )
        )
      )
      .limit(1);

    if (conversation.length > 0) {
      return conversation[0];
    }

    // Create new conversation
    const newConversation = await db
      .insert(conversations)
      .values({
        participant1Id,
        participant2Id,
      })
      .returning();

    return newConversation[0];
  }

  async getUserConversations(userId: string): Promise<any[]> {
    const userConversations = await db
      .select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Get other participant info and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        
        const otherUser = await db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImage: users.profileImage,
            isOnline: users.isOnline,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        const lastMessage = await db
          .select({
            content: messages.content,
            senderId: messages.senderId,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...conv,
          otherUser: otherUser[0] || null,
          lastMessage: lastMessage[0] || null,
        };
      })
    );

    return conversationsWithDetails;
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
    // Save to PostgreSQL for conversation metadata
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    // Update conversation's last message time
    await db
      .update(conversations)
      .set({
        lastMessageAt: sql`now()`,
      })
      .where(eq(conversations.id, conversationId));

    // Also save to external storage for backup and archiving
    try {
      const { messageStorage } = await import('./firebase-storage');
      const messageData = {
        id: newMessage[0].id,
        conversationId,
        senderId,
        content,
        createdAt: newMessage[0].createdAt,
      };
      await messageStorage.saveMessage(conversationId, messageData);
      console.log('Message backed up to external storage');
    } catch (error) {
      console.log('External storage backup failed:', (error as Error).message);
      // Continue execution - external storage is optional
    }

    return newMessage[0];
  }

  // Archive old messages to external storage and remove from main database
  async archiveOldMessages(daysOld: number = 30): Promise<{ archivedCount: number, conversationsAffected: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Get old messages
      const oldMessages = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(lt(messages.createdAt, cutoffDate));

      if (oldMessages.length === 0) {
        return { archivedCount: 0, conversationsAffected: 0 };
      }

      // Group messages by conversation
      const messagesByConversation = new Map<string, any[]>();
      oldMessages.forEach(msg => {
        if (!messagesByConversation.has(msg.conversationId)) {
          messagesByConversation.set(msg.conversationId, []);
        }
        messagesByConversation.get(msg.conversationId)!.push(msg);
      });

      // Archive to external storage
      const { messageStorage } = await import('./firebase-storage');
      for (const [conversationId, msgs] of messagesByConversation) {
        for (const msg of msgs) {
          await messageStorage.saveMessage(conversationId, msg);
        }
      }

      // Delete from PostgreSQL
      const messageIds = oldMessages.map(msg => msg.id);
      await db
        .delete(messages)
        .where(inArray(messages.id, messageIds));

      console.log(`Archived ${oldMessages.length} messages from ${messagesByConversation.size} conversations`);
      
      return { 
        archivedCount: oldMessages.length, 
        conversationsAffected: messagesByConversation.size 
      };

    } catch (error) {
      console.error('Archive process failed:', (error as Error).message);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalMessages: number;
    totalConversations: number;
    databaseSize: string;
    oldestMessage: string | null;
    newestMessage: string | null;
  }> {
    const [messageCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages);

    const [conversationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations);

    const [oldestMsg] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .orderBy(asc(messages.createdAt))
      .limit(1);

    const [newestMsg] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(1);

    // Estimate database size (rough calculation)
    const avgMessageSize = 100; // bytes
    const estimatedSize = messageCount.count * avgMessageSize;
    const sizeString = estimatedSize > 1024 * 1024 
      ? `${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(estimatedSize / 1024).toFixed(2)} KB`;

    return {
      totalMessages: messageCount.count,
      totalConversations: conversationCount.count,
      databaseSize: sizeString,
      oldestMessage: oldestMsg?.createdAt?.toISOString() || null,
      newestMessage: newestMsg?.createdAt?.toISOString() || null,
    };
  }

  async getConversationMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    const conversationMessages = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
        sender: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        }
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return conversationMessages.reverse(); // Show oldest first
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId) // Don't mark own messages as read
        )
      );
  }

  async createFriendshipConversationWithGreeting(userId1: string, userId2: string): Promise<void> {
    try {
      // Create or get conversation between the two users
      const conversation = await this.createOrGetConversation(userId1, userId2);
      
      // Get user info for personalized greeting
      const [sender] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, userId1))
        .limit(1);

      if (!sender) return;

      // Check if there are already messages in this conversation
      const existingMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .limit(1);

      // Only send greeting if this is a new conversation (no existing messages)
      if (existingMessages.length === 0) {
        const greetingMessage = `Xin chào! ${sender.firstName} và bạn vừa trở thành bạn bè. Hãy bắt đầu trò chuyện nhé! 👋`;
        
        // Send automatic greeting message
        await this.sendMessage(conversation.id, userId1, greetingMessage);
      }
    } catch (error) {
      console.error("Error creating friendship conversation with greeting:", error);
      // Don't throw error to avoid breaking the friendship creation process
    }
  }
  // === END Chat methods ===

  // === Admin methods ===
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    
    return allUsers;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      // Store password as plain text (WARNING: Security risk)
      const result = await db
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, userId));
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Reset password error:", error);
      return false;
    }
  }

  async updateUserBadge(userId: string, badgeImageUrl: string | null): Promise<any> {
    const [updatedUser] = await db
      .update(users)
      .set({ badgeImageUrl })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser || null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete related data first (cascade would handle this but let's be explicit)
      await db.delete(posts).where(eq(posts.userId, userId));
      await db.delete(comments).where(eq(comments.userId, userId));
      await db.delete(likes).where(eq(likes.userId, userId));
      await db.delete(stories).where(eq(stories.userId, userId));
      await db.delete(notifications).where(eq(notifications.userId, userId));
      await db.delete(friendships).where(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      );
      
      // Delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, userId));
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Delete user error:", error);
      return false;
    }
  }

  // === Beauty Contest methods ===
  async getBeautyContestants(): Promise<BeautyContestant[]> {
    const contestants = await db
      .select()
      .from(beautyContestants)
      .orderBy(desc(beautyContestants.totalVotes));
    
    return contestants;
  }

  async voteForContestant(userId: string, contestantId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Check remaining votes first (without transaction for Neon compatibility)
      const [dailyVotes] = await db
        .select()
        .from(userDailyVotes)
        .where(
          and(
            eq(userDailyVotes.userId, userId),
            eq(userDailyVotes.voteDate, today)
          )
        );

      const votesUsed = dailyVotes?.votesUsed || 0;
      if (votesUsed >= 5) {
        console.log(`User ${userId} has used ${votesUsed}/5 votes today`);
        return false;
      }

      // Insert vote record
      await db.insert(beautyVotes).values({
        userId,
        contestantId,
        voteDate: today
      });

      // Update contestant's total votes
      await db
        .update(beautyContestants)
        .set({ 
          totalVotes: sql`${beautyContestants.totalVotes} + 1` 
        })
        .where(eq(beautyContestants.id, contestantId));

      // Update user's daily votes
      if (dailyVotes) {
        await db
          .update(userDailyVotes)
          .set({ votesUsed: votesUsed + 1 })
          .where(eq(userDailyVotes.id, dailyVotes.id));
      } else {
        await db.insert(userDailyVotes).values({
          userId,
          voteDate: today,
          votesUsed: 1
        });
      }

      console.log(`User ${userId} voted successfully. Now used ${votesUsed + 1}/5 votes`);
      return true;
    } catch (error) {
      console.error("Vote error:", error);
      return false;
    }
  }

  async getUserDailyVotes(userId: string, date: string): Promise<UserDailyVotes | null> {
    const [dailyVotes] = await db
      .select()
      .from(userDailyVotes)
      .where(
        and(
          eq(userDailyVotes.userId, userId),
          eq(userDailyVotes.voteDate, date)
        )
      );

    return dailyVotes || null;
  }

  async getRemainingVotes(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const dailyVotes = await this.getUserDailyVotes(userId, today);
    const votesUsed = dailyVotes?.votesUsed || 0;
    const remaining = Math.max(0, 5 - votesUsed);
    console.log(`getRemainingVotes for user ${userId}: used ${votesUsed}/5, remaining ${remaining}`);
    return remaining; // Max 5 votes per day
  }

  async getUserVotedContestants(userId: string): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const votes = await db
        .select({ contestantId: beautyVotes.contestantId })
        .from(beautyVotes)
        .where(
          and(
            eq(beautyVotes.userId, userId),
            eq(beautyVotes.voteDate, today)
          )
        );
      
      return votes.map(vote => vote.contestantId).filter((id): id is string => id !== null);
    } catch (error) {
      console.error("Get user voted contestants error:", error);
      return [];
    }
  }

  // === Beauty Contest Admin methods ===
  async updateContestant(contestantId: string, updates: { name?: string; country?: string; avatar?: string }): Promise<BeautyContestant | null> {
    try {
      const [updatedContestant] = await db
        .update(beautyContestants)
        .set(updates)
        .where(eq(beautyContestants.id, contestantId))
        .returning();

      return updatedContestant || null;
    } catch (error) {
      console.error("Update contestant error:", error);
      return null;
    }
  }

  async getContestantVotes(contestantId: string): Promise<Array<{ user: User; voteDate: string }>> {
    const votes = await db
      .select({
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          email: users.email
        },
        voteDate: beautyVotes.voteDate,
        createdAt: beautyVotes.createdAt
      })
      .from(beautyVotes)
      .innerJoin(users, eq(beautyVotes.userId, users.id))
      .where(eq(beautyVotes.contestantId, contestantId))
      .orderBy(desc(beautyVotes.createdAt));

    return votes.map(vote => ({
      user: vote.user as User,
      voteDate: vote.voteDate
    }));
  }

  async getAllContestantVotes(): Promise<Array<{ contestant: BeautyContestant; votes: Array<{ user: User; voteDate: string }> }>> {
    const contestants = await this.getBeautyContestants();
    
    const result = await Promise.all(
      contestants.map(async (contestant) => {
        const votes = await this.getContestantVotes(contestant.id);
        return {
          contestant,
          votes
        };
      })
    );

    return result;
  }

  async createContestant(data: { name: string; country: string; avatar: string }): Promise<BeautyContestant> {
    const [newContestant] = await db
      .insert(beautyContestants)
      .values({
        name: data.name,
        country: data.country,
        avatar: data.avatar,
        totalVotes: 0
      })
      .returning();

    return newContestant;
  }

  async deleteContestant(contestantId: string): Promise<boolean> {
    try {
      // Delete related votes first
      await db.delete(beautyVotes).where(eq(beautyVotes.contestantId, contestantId));
      
      // Delete contestant
      const result = await db
        .delete(beautyContestants)
        .where(eq(beautyContestants.id, contestantId));

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Delete contestant error:", error);
      return false;
    }
  }
  // === END Beauty Contest Admin methods ===

  // === END Beauty Contest methods ===

  // === END Admin methods ===
}

export const storage = new DatabaseStorage();