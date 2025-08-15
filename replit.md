# Kết Nối Đẹp - Social Media App

## Overview
Kết Nối Đẹp is a comprehensive social media platform designed to foster connections and community. Built with a modern tech stack, it aims to provide a rich user experience with features such as user authentication, post sharing, stories, group interactions, and real-time messaging. The project's vision is to create a vibrant online space for users to connect and share, leveraging contemporary design aesthetics and robust technical architecture.

## User Preferences
- Language: Vietnamese
- Focus on production stability and reliability
- Prioritize fixing deployment-related issues

## System Architecture
The application is built with a clear separation of concerns, employing a client-server architecture.

**Frontend:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS for utility-first styling
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** React Query for efficient data fetching and caching.
- **UI/UX Design:** The application has evolved through several design iterations, currently featuring a Facebook-inspired mobile interface design. This includes:
    - Facebook-style horizontal bottom navigation with clean white background, simple icons, and blue accent colors for active states.
    - Minimalist navigation bar with Home, Videos (with notification badge), Friends, Profile, Notifications, and Menu icons.
    - Clean dropdown menu from the menu button with gray backgrounds and simple hover effects.
    - Facebook-style simple layout for post creation with an avatar, rounded input, and photo icon.
    - Post cards designed to match a clean white card aesthetic with specific avatar styling, reaction layouts, and simple action buttons.
    - Stories section maintains existing design structure.
    - Login and Signup interfaces with clean, professional styling.

**Backend:**
- **Framework:** Express.js with TypeScript
- **Database ORM:** Drizzle ORM for PostgreSQL.
- **Authentication:** Session-based authentication using `express-session` for simplicity and direct session management.

**Technical Implementations & Feature Specifications:**
- **Post Display:** Videos in the feed display a thumbnail/cover image with a play button overlay instead of directly embedding a video player.
- **Responsive Design:** Core components are designed to be responsive across mobile and desktop breakpoints.
- **Database Schema:** Defined in `shared/schema.ts`, outlining models and relations.

## External Dependencies
- **Database:** PostgreSQL
- **Cloud Storage:** Cloudinary for file storage (e.g., user avatars, post images/videos).
- **Deployment Platform:** Render.com for hosting frontend and backend services.