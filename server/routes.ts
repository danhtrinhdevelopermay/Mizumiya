import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { db, pool } from "./db";
import { requireAuth, attachUser } from "./auth";
import CloudinaryService from "./cloudinary";
import { youtubeService } from "./youtube";
import { youtubeExtractor } from "./youtube-extractor";
import { 
  insertPostSchema, 
  insertCommentSchema, 
  insertLikeSchema, 
  insertFriendshipSchema,
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  insertConversationSchema,
  insertMessageSchema,
  users
} from "@shared/schema";
import { z } from "zod";

// Configure multer for media uploads (images and videos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to support videos
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(extname) && file.mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const PgStore = connectPgSimple(session);
  const sessionStore = new PgStore({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true, // Let it create the table if missing
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true, // Create sessions for all visitors
    cookie: {
      secure: false, // Always false - Replit and Render use proxy
      httpOnly: false, // Allow client-side access for debugging  
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Always lax for better compatibility
      domain: undefined, // Let browser decide the domain
    },
    name: 'sessionId',
    rolling: true, // Refresh session on each request
  }));

  // Apply user attachment middleware to all routes
  app.use(attachUser);

  // Clear cookies endpoint
  app.post("/api/auth/clear-cookies", (req, res) => {
    console.log("=== CLEARING COOKIES ===");
    res.clearCookie('sessionId', { path: '/' });
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Failed to clear session" });
      }
      console.log("✅ Session destroyed and cookies cleared");
      res.json({ message: "Cookies cleared successfully" });
    });
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      console.log("Raw signup request body:", JSON.stringify(req.body, null, 2));
      
      // Clean null values before validation
      const cleanedBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [key, value === null ? undefined : value])
      );
      console.log("Cleaned request body:", JSON.stringify(cleanedBody, null, 2));
      
      const userData = signUpSchema.parse(cleanedBody);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      const user = await storage.createUser(userData);
      
      // Create session
      req.session.userId = user.id;
      req.session.user = user;
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account", error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    console.log("=== SIGNIN DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Session before:", req.session);
    
    try {
      const { email, password } = signInSchema.parse(req.body);
      
      const user = await storage.authenticateUser(email, password);
      if (!user) {
        console.log("❌ Authentication failed for email:", email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      req.session.userId = user.id;
      req.session.user = user;
      
      console.log("✅ Session created:");
      console.log("Session ID:", req.session.id);
      console.log("Session userId:", req.session.userId);
      console.log("Session user email:", user.email);
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Signed in successfully" });
    } catch (error) {
      console.error("❌ Signin error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  app.post("/api/auth/signout", requireAuth, async (req, res) => {
    try {
      // Set user offline before destroying session
      if (req.session.userId) {
        await storage.setUserOffline(req.session.userId);
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to sign out" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Signed out successfully" });
      });
    } catch (error) {
      console.error("Signout error:", error);
      res.status(500).json({ message: "Failed to sign out" });
    }
  });

  // Debug endpoint for production troubleshooting
  app.get("/api/debug/session", (req, res) => {
    console.log("=== DEBUG SESSION ENDPOINT ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Session:", req.session);
    console.log("Session ID:", req.session?.id);
    console.log("Session userId:", req.session?.userId);
    console.log("Cookie header:", req.headers.cookie);
    
    res.json({
      env: process.env.NODE_ENV,
      hasSession: !!req.session,
      sessionId: req.session?.id,
      hasUserId: !!req.session?.userId,
      userId: req.session?.userId,
      hasCookie: !!req.headers.cookie,
      cookieHeader: req.headers.cookie,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      host: req.headers.host,
      protocol: req.protocol,
      secure: req.secure
    });
  });

  // Debug endpoint for authentication redirect flow testing
  app.get("/api/debug/auth-flow", (req, res) => {
    const isAuthenticated = !!req.session?.userId;
    const user = req.session?.user;
    
    console.log("=== AUTH FLOW DEBUG ===");
    console.log("Authenticated:", isAuthenticated);
    console.log("User ID:", req.session?.userId);
    console.log("Full session:", req.session);
    
    res.json({
      status: isAuthenticated ? "authenticated" : "not_authenticated",
      userId: req.session?.userId,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName
      } : null,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hostname: req.headers.host,
      query: req.query,
      recommendations: {
        shouldRedirect: isAuthenticated,
        targetUrl: isAuthenticated ? "/home" : "/signin",
        reason: isAuthenticated ? "User is authenticated, should access home" : "User not authenticated, should login"
      }
    });
  });

  // Get current user
  app.get("/api/users/me", async (req, res) => {
    console.log("=== GET /api/users/me DEBUG ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Request headers:", {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    });
    console.log("Session:", req.session);
    console.log("Session ID:", req.session?.id);
    console.log("Session userId:", req.session?.userId);
    
    if (!req.session?.userId) {
      console.log("❌ No session userId found, sending 401");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      console.log("✅ User authenticated, fetching user data...");
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        console.log("❌ User not found in database");
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user online status when they make any request
      await storage.updateUserOnlineStatus(req.session.userId!);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      console.log("✅ Returning user data for:", userWithoutPassword.email);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("❌ Error in /api/users/me:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Heartbeat endpoint to maintain online status
  app.post("/api/users/heartbeat", requireAuth, async (req, res) => {
    try {
      const { offline } = req.body;
      
      if (offline) {
        await storage.setUserOffline(req.session.userId!);
        res.json({ status: "offline" });
      } else {
        await storage.updateUserOnlineStatus(req.session.userId!);
        res.json({ status: "online" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // Update user profile
  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const profileData = req.body;

      // Validate and clean the data
      const allowedFields = [
        'firstName', 'lastName', 'bio', 'dateOfBirth', 'gender', 
        'phoneNumber', 'location', 'website', 'workplace', 'education', 
        'relationshipStatus', 'profileImage', 'coverImage'
      ];

      const updateData: any = {};
      for (const field of allowedFields) {
        if (profileData[field] !== undefined && profileData[field] !== '') {
          updateData[field] = profileData[field];
        }
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password back
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Search users by username or name - MOVED TO TOP TO AVOID CONFLICTS  
  app.get("/api/users/search", async (req, res) => {
    console.log('=== SEARCH ROUTE HIT ===');
    console.log('Query params:', req.query);
    console.log('Session:', req.session);
    console.log('Session userId:', req.session.userId);
    
    // Check auth manually for better debugging
    if (!req.session.userId) {
      console.log('No session userId found, returning auth required');
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { q } = req.query;
      console.log('Search route called with query:', q, 'from user:', req.session.userId);
      
      if (!q || typeof q !== 'string') {
        console.log('Query validation failed:', { q, type: typeof q });
        return res.status(400).json({ message: "Search query is required" });
      }
      
      console.log('About to call storage.searchUsers...');
      const users = await storage.searchUsers(q, req.session.userId!);
      console.log('Storage returned users count:', users.length);
      
      // Always return the results, even if empty
      console.log('Returning search results:', users);
      res.json(users);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Profile routes
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/me", requireAuth, async (req, res) => {
    try {
      const updates = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session
      req.session.user = user;
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get feed posts
  app.get("/api/posts/feed", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await storage.getFeedPosts(req.session.userId!, limit);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get a specific post by ID
  app.get("/api/posts/:postId", async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Create a new post
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const { mediaUrls, ...restBody } = req.body;
      
      const postData = insertPostSchema.parse({
        ...restBody,
        userId: req.session.userId!,
        images: mediaUrls || [] // Use mediaUrls as images array
      });
      
      const post = await storage.createPost(postData);
      
      // Create notifications for friends about new post
      await storage.createNewPostNotification(
        req.session.userId!,
        post.id,
        post.content || ''
      );
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error('Create post error:', error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Toggle like on a post
  app.post("/api/posts/:postId/like", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const likeData = insertLikeSchema.parse({
        postId,
        userId: req.session.userId!,
        type: req.body.type || "like"
      });
      
      const result = await storage.toggleLike(likeData);
      
      // Create notification if post was liked (not unliked)
      if (result.liked) {
        const post = await storage.getPost(postId);
        if (post) {
          await storage.createLikeNotification(
            req.session.userId!,
            post.userId,
            postId,
            likeData.type || "like"
          );
        }
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid like data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create a comment
  app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        userId: req.session.userId!
      });
      
      const comment = await storage.createComment(commentData);
      
      // Create notification for post owner about new comment
      const post = await storage.getPost(postId);
      if (post) {
        await storage.createCommentNotification(
          req.session.userId!,
          post.userId,
          postId,
          commentData.content
        );
      }
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get friend requests
  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getFriendRequests(req.session.userId!);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  // Send friend request
  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const friendshipData = insertFriendshipSchema.parse({
        requesterId: req.session.userId!,
        addresseeId: req.body.userId
      });
      
      const friendship = await storage.sendFriendRequest(friendshipData);
      
      // Create notification for friend request
      await storage.createFriendRequestNotification(
        req.session.userId!,
        req.body.userId
      );
      
      res.status(201).json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friendship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  // Respond to friend request
  app.patch("/api/friends/:friendshipId", requireAuth, async (req, res) => {
    try {
      const { friendshipId } = req.params;
      const { status } = req.body;
      
      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const friendship = await storage.respondToFriendRequest(friendshipId, status);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      // Create notification and conversation if friend request was accepted
      if (status === "accepted") {
        await storage.createFriendAcceptNotification(
          req.session.userId!,
          friendship.requesterId
        );
        
        // Create conversation with automatic greeting message
        await storage.createFriendshipConversationWithGreeting(
          req.session.userId!,
          friendship.requesterId
        );
      } else if (status === "declined") {
        // Send notification about friend request decline
        await storage.createFriendDeclineNotification(
          req.session.userId!,
          friendship.requesterId
        );
      }
      
      res.json(friendship);
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  // Get online friends
  app.get("/api/friends/online", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getOnlineFriends(req.session.userId!);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch online friends" });
    }
  });

  // Get friends count
  app.get("/api/friends/count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getFriendsCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends count" });
    }
  });

  // Get friends list
  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getFriends(req.session.userId!);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });



  // Get user profile with friendship status
  app.get("/api/users/:userId/profile", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const userProfile = await storage.getUserWithFriendshipStatus(userId, req.session.userId!);
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Get user's posts for profile page
  app.get("/api/users/:userId/posts", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Get user's posts
  app.get("/api/posts/user", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getUserPosts(req.session.userId!);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Update user profile
  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUserProfile(req.session.userId!, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload user image (avatar or cover)
  app.post("/api/users/upload-image", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const { type } = req.body; // 'avatar' or 'cover'
      
      if (!type || !['avatar', 'cover'].includes(type)) {
        return res.status(400).json({ message: "Invalid image type" });
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadProfileImage(
        req.file.buffer,
        req.session.userId!,
        type
      );
      
      // Update user with new image URL
      const updates = type === 'avatar' 
        ? { profileImage: uploadResult.secure_url }
        : { coverImage: uploadResult.secure_url };

      const updatedUser = await storage.updateUserProfile(req.session.userId!, updates);
      
      res.json({ 
        user: updatedUser,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        message: `${type} updated successfully` 
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload media for posts (images/videos)
  app.post("/api/posts/upload-media", requireAuth, upload.array('media', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No media files provided" });
      }

      const { postId } = req.body;
      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }

      const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
        const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        return CloudinaryService.uploadPostMedia(
          file.buffer,
          req.session.userId!,
          postId,
          mediaType
        );
      });

      const uploadResults = await Promise.all(uploadPromises);
      const mediaUrls = uploadResults.map(result => result.secure_url);

      res.json({ 
        mediaUrls,
        publicIds: uploadResults.map(result => result.public_id),
        message: "Media uploaded successfully" 
      });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  // Create a story
  app.post("/api/stories", requireAuth, upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No media file provided for story" });
      }

      const { content } = req.body;
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadStoryMedia(
        req.file.buffer,
        req.session.userId!,
        `story_${Date.now()}`,
        mediaType
      );

      // Create story in database
      const storyData = {
        userId: req.session.userId!,
        content: content || "",
        image: uploadResult.secure_url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Create story error:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // Upload media for stories (images/videos)
  app.post("/api/stories/upload-media", requireAuth, upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No media file provided" });
      }

      const { storyId } = req.body;
      if (!storyId) {
        return res.status(400).json({ message: "Story ID is required" });
      }

      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const uploadResult = await CloudinaryService.uploadStoryMedia(
        req.file.buffer,
        req.session.userId!,
        storyId,
        mediaType
      );

      res.json({ 
        mediaUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        mediaType,
        message: "Story media uploaded successfully" 
      });
    } catch (error) {
      console.error('Story media upload error:', error);
      res.status(500).json({ message: "Failed to upload story media" });
    }
  });

  // Delete media from Cloudinary
  app.delete("/api/media/:publicId", requireAuth, async (req, res) => {
    try {
      const { publicId } = req.params;
      if (!publicId) {
        return res.status(400).json({ message: "Public ID is required" });
      }

      await CloudinaryService.deleteFile(publicId);
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error('Media deletion error:', error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Get friends stories
  app.get("/api/stories", requireAuth, async (req, res) => {
    try {
      const stories = await storage.getFriendsStories(req.session.userId!);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Get single story
  app.get("/api/stories/:storyId", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const story = await storage.getStoryById(storyId, req.session.userId!);
      
      if (!story) {
        return res.status(404).json({ message: "Story not found or expired" });
      }
      
      res.json(story);
    } catch (error) {
      console.error("Get story error:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // Delete story
  app.delete("/api/stories/:storyId", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const success = await storage.deleteStory(storyId, req.session.userId!);
      
      if (!success) {
        return res.status(404).json({ message: "Story not found or you don't have permission" });
      }
      
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      console.error("Delete story error:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Add story comment
  app.post("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const comment = await storage.addStoryComment(storyId, req.session.userId!, content);
      res.json(comment);
    } catch (error) {
      console.error("Add story comment error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get story comments
  app.get("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const comments = await storage.getStoryComments(storyId);
      res.json(comments);
    } catch (error) {
      console.error("Get story comments error:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add story reaction
  app.post("/api/stories/:storyId/reactions", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const { type } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Reaction type is required" });
      }
      
      const reaction = await storage.toggleStoryReaction(storyId, req.session.userId!, type);
      res.json(reaction);
    } catch (error) {
      console.error("Add story reaction error:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Get story reactions
  app.get("/api/stories/:storyId/reactions", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const reactions = await storage.getStoryReactions(storyId);
      res.json(reactions);
    } catch (error) {
      console.error("Get story reactions error:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  // Simple placeholder image endpoint
  app.get("/api/placeholder/:size", (req, res) => {
    const size = parseInt(req.params.size) || 32;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#E5E7EB"/>
      <path d="M${size * 0.25} ${size * 0.35}C${size * 0.25} ${size * 0.25} ${size * 0.35} ${size * 0.2} ${size * 0.5} ${size * 0.2}C${size * 0.65} ${size * 0.2} ${size * 0.75} ${size * 0.25} ${size * 0.75} ${size * 0.35}C${size * 0.75} ${size * 0.45} ${size * 0.65} ${size * 0.5} ${size * 0.5} ${size * 0.5}C${size * 0.35} ${size * 0.5} ${size * 0.25} ${size * 0.45} ${size * 0.25} ${size * 0.35}Z" fill="#9CA3AF"/>
      <path d="M${size * 0.2} ${size * 0.8}C${size * 0.2} ${size * 0.65} ${size * 0.3} ${size * 0.6} ${size * 0.5} ${size * 0.6}C${size * 0.7} ${size * 0.6} ${size * 0.8} ${size * 0.65} ${size * 0.8} ${size * 0.8}V${size * 0.9}H${size * 0.2}V${size * 0.8}Z" fill="#9CA3AF"/>
    </svg>`;
    
    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Notifications routes
  
  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getUserNotifications(req.session.userId!, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notifications count
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id);
      if (success) {
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const success = await storage.markAllNotificationsAsRead(req.session.userId!);
      res.json({ message: "All notifications marked as read", updated: success });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(id);
      if (success) {
        res.json({ message: "Notification deleted" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // === Chat routes ===
  // Get user conversations
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.session.userId!);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create or get existing conversation
  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "Other user ID is required" });
      }
      
      const conversation = await storage.createOrGetConversation(req.session.userId!, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:conversationId/messages", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message  
  app.post("/api/conversations/:conversationId/messages", requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const message = await storage.sendMessage(
        conversationId, 
        req.session.userId!, 
        content
      );
      
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // === Storage Management routes ===
  // Get storage statistics
  app.get("/api/admin/storage-stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStorageStats();
      res.json(stats);
    } catch (error) {
      console.error("Get storage stats error:", error);
      res.status(500).json({ message: "Failed to fetch storage statistics" });
    }
  });

  // Archive old messages
  app.post("/api/admin/archive-messages", requireAuth, async (req, res) => {
    try {
      const { daysOld = 30 } = req.body;
      const result = await storage.archiveOldMessages(daysOld);
      res.json({
        message: "Archive completed successfully",
        ...result
      });
    } catch (error) {
      console.error("Archive messages error:", error);
      res.status(500).json({ message: "Failed to archive messages" });
    }
  });

  // === Admin routes ===
  // Get all users for admin
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Simple admin check - in production you'd want proper admin authentication
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Reset user password
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({ message: "User ID and new password are required" });
      }

      const success = await storage.resetUserPassword(userId, newPassword);
      
      if (success) {
        res.json({ message: "Password reset successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Update user badge (admin only)
  app.patch("/api/admin/update-badge", async (req, res) => {
    try {
      const { userId, badgeImageUrl } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const updatedUser = await storage.updateUserBadge(userId, badgeImageUrl || null);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user badge error:", error);
      res.status(500).json({ message: "Failed to update user badge" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Health check endpoint for load balancers
  app.get("/api/health", async (req, res) => {
    try {
      // Simple database health check
      await db.select().from(users).limit(1);
      
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(503).json({
        status: "unhealthy",
        message: "Database connection failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Beauty Contest Routes
  app.get("/api/beauty-contest", async (req, res) => {
    try {
      const contestants = await storage.getBeautyContestants();
      res.json(contestants);
    } catch (error) {
      console.error("Get beauty contestants error:", error);
      res.status(500).json({ message: "Failed to get contestants" });
    }
  });

  app.post("/api/beauty-contest/:contestantId/vote", requireAuth, async (req, res) => {
    try {
      const { contestantId } = req.params;
      const userId = req.user!.id;
      
      console.log(`Vote request from user ${userId} for contestant ${contestantId}`);
      
      // Check current remaining votes before processing
      const currentRemaining = await storage.getRemainingVotes(userId);
      console.log(`Current remaining votes: ${currentRemaining}`);
      
      const success = await storage.voteForContestant(userId, contestantId);
      
      if (success) {
        const remainingVotes = await storage.getRemainingVotes(userId);
        console.log(`Vote successful, new remaining: ${remainingVotes}`);
        res.json({ 
          success: true, 
          message: "Vote thành công!",
          remainingVotes 
        });
      } else {
        console.log(`Vote failed for user ${userId}`);
        res.status(400).json({ 
          success: false, 
          message: "Bạn đã sử dụng hết 5 lượt vote hôm nay!" 
        });
      }
    } catch (error) {
      console.error("Vote endpoint error:", error);
      res.status(500).json({ message: "Lỗi khi vote, vui lòng thử lại" });
    }
  });

  app.get("/api/beauty-contest/remaining-votes", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const remainingVotes = await storage.getRemainingVotes(userId);
      res.json({ remainingVotes });
    } catch (error) {
      console.error("Get remaining votes error:", error);
      res.status(500).json({ message: "Failed to get remaining votes" });
    }
  });

  app.get("/api/beauty-contest/my-votes", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const votedContestants = await storage.getUserVotedContestants(userId);
      res.json(votedContestants);
    } catch (error) {
      console.error("Get user voted contestants error:", error);
      res.status(500).json({ message: "Failed to get voted contestants" });
    }
  });

  // Beauty Contest Admin Routes
  app.get("/api/admin/beauty-contest/votes", requireAuth, async (req, res) => {
    try {
      const allVotes = await storage.getAllContestantVotes();
      res.json(allVotes);
    } catch (error) {
      console.error("Get all contestant votes error:", error);
      res.status(500).json({ message: "Failed to get contestant votes" });
    }
  });

  app.get("/api/admin/beauty-contest/:contestantId/votes", requireAuth, async (req, res) => {
    try {
      const { contestantId } = req.params;
      const votes = await storage.getContestantVotes(contestantId);
      res.json(votes);
    } catch (error) {
      console.error("Get contestant votes error:", error);
      res.status(500).json({ message: "Failed to get contestant votes" });
    }
  });

  app.put("/api/admin/beauty-contest/:contestantId", requireAuth, async (req, res) => {
    try {
      const { contestantId } = req.params;
      const { name, country, avatar } = req.body;
      
      const updatedContestant = await storage.updateContestant(contestantId, {
        name,
        country,
        avatar
      });
      
      if (updatedContestant) {
        res.json(updatedContestant);
      } else {
        res.status(404).json({ message: "Contestant not found" });
      }
    } catch (error) {
      console.error("Update contestant error:", error);
      res.status(500).json({ message: "Failed to update contestant" });
    }
  });

  app.post("/api/admin/beauty-contest", requireAuth, async (req, res) => {
    try {
      const { name, country, avatar } = req.body;
      
      const newContestant = await storage.createContestant({
        name,
        country,
        avatar
      });
      
      res.status(201).json(newContestant);
    } catch (error) {
      console.error("Create contestant error:", error);
      res.status(500).json({ message: "Failed to create contestant" });
    }
  });

  app.delete("/api/admin/beauty-contest/:contestantId", requireAuth, async (req, res) => {
    try {
      const { contestantId } = req.params;
      
      const success = await storage.deleteContestant(contestantId);
      
      if (success) {
        res.json({ message: "Contestant deleted successfully" });
      } else {
        res.status(404).json({ message: "Contestant not found" });
      }
    } catch (error) {
      console.error("Delete contestant error:", error);
      res.status(500).json({ message: "Failed to delete contestant" });
    }
  });

  // YouTube API routes
  app.get("/api/youtube/search", requireAuth, async (req, res) => {
    try {
      console.log("YouTube search request:", req.query);
      const { q, maxResults = "12", order = "relevance", pageToken } = req.query;
      
      if (!q || typeof q !== 'string') {
        console.log("Missing or invalid query parameter:", { q });
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      console.log("Searching YouTube for:", q);
      const results = await youtubeService.searchVideos({
        q,
        maxResults: parseInt(maxResults as string),
        order: order as any,
        pageToken: pageToken as string,
      });

      console.log("YouTube API returned:", results.items.length, "videos");
      res.json(results);
    } catch (error) {
      console.error("YouTube search error:", error);
      res.status(500).json({ 
        message: "Failed to search YouTube videos",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/youtube/video/:videoId", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      
      const videoDetails = await youtubeService.getVideoDetails(videoId);
      
      if (!videoDetails) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json(videoDetails);
    } catch (error) {
      console.error("YouTube video details error:", error);
      res.status(500).json({ 
        message: "Failed to get video details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/youtube/trending", requireAuth, async (req, res) => {
    try {
      const { maxResults = "24", regionCode = "VN" } = req.query;
      
      const results = await youtubeService.getTrendingVideos(
        regionCode as string,
        parseInt(maxResults as string)
      );

      res.json(results);
    } catch (error) {
      console.error("YouTube trending error:", error);
      res.status(500).json({ 
        message: "Failed to get trending videos",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Extract direct stream URLs for YouTube video
  app.get("/api/youtube/stream/:videoId", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      const { quality } = req.query;
      
      console.log(`🎬 Extracting stream for video: ${videoId}`);
      
      if (quality === 'options') {
        // Return available quality options
        const options = await youtubeExtractor.getQualityOptions(videoId);
        return res.json({ options });
      }
      
      // Get best quality stream or all streams
      const streams = await youtubeExtractor.getVideoStreams(videoId);
      
      res.json({
        title: streams.title,
        duration: streams.duration,
        bestQuality: streams.bestQuality,
        audioOnly: streams.audioOnly,
        formats: streams.formats.slice(0, 10) // Limit formats to prevent huge responses
      });
      
    } catch (error) {
      console.error("YouTube stream extraction error:", error);
      res.status(500).json({ 
        message: "Failed to extract video streams",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // YouTube video stream proxy - trả về video stream trực tiếp
  app.get("/api/youtube/proxy/:videoId", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      const { quality } = req.query;
      
      console.log(`🎬 Starting video proxy for: ${videoId}${quality ? ` (quality: ${quality})` : ''}`);
      
      // Get video stream data
      const streams = await youtubeExtractor.getVideoStreams(videoId);
      
      let targetFormat = streams.bestQuality;
      
      // If specific quality requested, find matching format
      if (quality && quality !== 'auto') {
        const matchingFormat = streams.formats.find(f => f.quality === quality);
        if (matchingFormat) {
          targetFormat = matchingFormat;
        }
      }
      
      if (!targetFormat?.url) {
        console.error(`❌ No suitable format found for ${videoId}`);
        return res.status(404).send('Video format not found');
      }
      
      console.log(`🎥 Proxying ${targetFormat.quality} stream (${targetFormat.container})`);
      
      // Create request to YouTube with proper headers
      const streamHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
      };
      
      // Handle range requests for video seeking
      if (req.headers.range) {
        streamHeaders['Range'] = req.headers.range;
      }
      
      const streamResponse = await fetch(targetFormat.url, {
        headers: streamHeaders,
        method: 'GET'
      });
      
      if (!streamResponse.ok) {
        console.error(`❌ Stream fetch failed: ${streamResponse.status}`);
        return res.status(502).send('Failed to fetch video stream');
      }
      
      // Set video response headers with proper CORS for video playback
      const responseHeaders: Record<string, string> = {
        'Content-Type': streamResponse.headers.get('content-type') || 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization, Accept, Accept-Encoding',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      };
      
      // Copy relevant headers from YouTube response
      const contentLength = streamResponse.headers.get('content-length');
      const contentRange = streamResponse.headers.get('content-range');
      
      if (contentLength) responseHeaders['Content-Length'] = contentLength;
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange;
        res.status(206); // Partial Content
      } else {
        res.status(200);
      }
      
      res.set(responseHeaders);
      
      console.log(`✅ Stream headers set. Content-Type: ${responseHeaders['Content-Type']}`);
      
      // Stream the video data directly to client using Node.js streams
      if (streamResponse.body) {
        const reader = streamResponse.body.getReader();
        
        const streamToClient = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                console.log(`✅ Stream completed for ${videoId}`);
                break;
              }
              
              if (!res.write(Buffer.from(value))) {
                // Wait for drain event if write buffer is full
                await new Promise(resolve => res.once('drain', resolve));
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
            if (!res.headersSent) {
              res.status(500).end();
            }
          }
        };
        
        streamToClient();
      } else {
        console.error('❌ No response body available');
        res.status(502).send('No video data available');
      }
      
    } catch (error) {
      console.error(`❌ Proxy error for ${req.params.videoId}:`, error);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  });

  // Test endpoint to verify proxy accessibility
  app.get("/api/test/video-proxy/:videoId", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      const proxyUrl = `/api/youtube/proxy/${videoId}`;
      
      console.log(`🧪 Testing proxy accessibility for: ${videoId}`);
      
      // Test if we can reach the proxy endpoint
      const testResponse = await fetch(`http://localhost:5000${proxyUrl}`, {
        method: 'HEAD',
        headers: {
          'Cookie': req.headers.cookie || '',
          'Authorization': req.headers.authorization || ''
        }
      });
      
      res.json({
        accessible: testResponse.ok,
        status: testResponse.status,
        headers: Object.fromEntries(testResponse.headers.entries()),
        proxyUrl
      });
    } catch (error) {
      console.error("Test proxy error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Test failed"
      });
    }
  });

  // Debug session endpoint
  app.get('/api/debug/session', (req, res) => {
    res.json({
      sessionId: req.session.id,
      userId: req.session.userId,
      hasUser: !!req.session.user,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      host: req.headers.host,
      sameSite: req.session.cookie.sameSite,
      secure: req.session.cookie.secure,
      httpOnly: req.session.cookie.httpOnly,
      nodeEnv: process.env.NODE_ENV,
    });
  });

  // Generic routes  
  app.get('/api/placeholder/:size', (req, res) => {
    const size = parseInt(req.params.size);
    res.json({ 
      url: `https://via.placeholder.com/${size}`, 
      alt: `Placeholder ${size}x${size}` 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
