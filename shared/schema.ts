import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hashed password
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other
  phoneNumber: text("phone_number"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  workplace: text("workplace"),
  education: text("education"),
  relationshipStatus: text("relationship_status"),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  badgeImageUrl: text("badge_image_url"), // Admin-only badge image displayed next to username
  isEmailVerified: boolean("is_email_verified").default(false),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  images: json("images").$type<string[]>().default([]),
  type: text("type").default("text"), // text, image, video, reel, story
  visibility: text("visibility").default("public"), // public, friends, private
  
  // Video features
  title: text("title"), // Required for reels/pages
  description: text("description"), // Enhanced description with hashtags/links
  location: text("location"), // Location tagging
  category: text("category"), // Topic category (travel, food, etc.)
  hashtags: json("hashtags").$type<string[]>().default([]), // Hashtag array
  coverImage: text("cover_image"), // Custom or auto-generated cover
  videoLabels: json("video_labels").$type<string[]>().default([]), // Content labels (child-friendly, copyright, sensitive)
  musicTrack: text("music_track"), // Music for reels/stories
  
  // Video settings
  commentsEnabled: boolean("comments_enabled").default(true),
  downloadEnabled: boolean("download_enabled").default(true),
  trimStart: integer("trim_start").default(0), // Trim start time in seconds
  trimEnd: integer("trim_end"), // Trim end time in seconds
  
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").default("like"), // like, love, laugh, angry, sad
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  addresseeId: varchar("addressee_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // pending, accepted, declined, blocked
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content"),
  image: text("image").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const storyReactions = pgTable("story_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // like, love, laugh, angry, sad
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").references(() => users.id).notNull(),
  participant2Id: varchar("participant2_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Authentication schemas
export const signUpSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.preprocess((val) => val === null || val === "" ? undefined : val, z.string().optional().transform((str) => str ? new Date(str) : null)),
  gender: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  phoneNumber: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  bio: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  location: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  website: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  workplace: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  education: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  relationshipStatus: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  profileImage: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  coverImage: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  confirmPassword: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateProfileSchema = createInsertSchema(users).omit({
  id: true,
  email: true,
  password: true,
  createdAt: true,
  lastSeen: true,
  isEmailVerified: true,
  isOnline: true,
}).partial();

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  createdAt: true,
});

export const insertStoryReactionSchema = createInsertSchema(storyReactions).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Notifications schema
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // content_interaction, connection, group, messaging, event, system, friend_activity
  category: text("category").notNull(), // like, comment, friend_request, message, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedUserId: text("related_user_id").references(() => users.id, { onDelete: "cascade" }),
  relatedPostId: text("related_post_id").references(() => posts.id, { onDelete: "cascade" }),
  relatedCommentId: text("related_comment_id").references(() => comments.id, { onDelete: "cascade" }),
  relatedGroupId: text("related_group_id"), // For future group functionality
  relatedEventId: text("related_event_id"), // For future event functionality
  isRead: boolean("is_read").default(false).notNull(),
  actionUrl: text("action_url"), // URL to navigate when clicked
  metadata: json("metadata"), // Additional data (reaction type, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SignUpUser = z.infer<typeof signUpSchema>;
export type SignInUser = z.infer<typeof signInSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type StoryComment = typeof storyComments.$inferSelect;
export type InsertStoryComment = z.infer<typeof insertStoryCommentSchema>;
export type StoryReaction = typeof storyReactions.$inferSelect;
export type InsertStoryReaction = z.infer<typeof insertStoryReactionSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types for API responses
export type PostWithUser = Post & {
  user: User;
  userLike?: Like;
  isLiked: boolean;
};

export type CommentWithUser = Comment & {
  user: User;
};

export type StoryCommentWithUser = StoryComment & {
  user: User;
};

export type StoryReactionWithUser = StoryReaction & {
  user: User;
};

export type StoryWithUser = Story & {
  user: User;
};

export type UserWithFriendshipStatus = User & {
  friendshipStatus?: string;
  mutualFriendsCount?: number;
};

export type NotificationWithUser = Notification & {
  relatedUser?: User;
};

// Beauty Contest Tables
export const beautyContestants = pgTable("beauty_contestants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country").notNull(),
  avatar: text("avatar").notNull(),
  totalVotes: integer("total_votes").default(0),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const beautyVotes = pgTable("beauty_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  contestantId: varchar("contestant_id").references(() => beautyContestants.id, { onDelete: "cascade" }),
  voteDate: text("vote_date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const userDailyVotes = pgTable("user_daily_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  voteDate: text("vote_date").notNull(), // YYYY-MM-DD format
  votesUsed: integer("votes_used").default(0),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Beauty Contest Schemas
export const insertBeautyContestantSchema = createInsertSchema(beautyContestants).omit({
  id: true,
  createdAt: true,
  totalVotes: true,
});

export const insertBeautyVoteSchema = createInsertSchema(beautyVotes).omit({
  id: true,
  createdAt: true,
});

export const insertUserDailyVotesSchema = createInsertSchema(userDailyVotes).omit({
  id: true,
  createdAt: true,
});

// Beauty Contest Types
export type BeautyContestant = typeof beautyContestants.$inferSelect;
export type InsertBeautyContestant = z.infer<typeof insertBeautyContestantSchema>;
export type BeautyVote = typeof beautyVotes.$inferSelect;
export type InsertBeautyVote = z.infer<typeof insertBeautyVoteSchema>;
export type UserDailyVotes = typeof userDailyVotes.$inferSelect;
export type InsertUserDailyVotes = z.infer<typeof insertUserDailyVotesSchema>;
