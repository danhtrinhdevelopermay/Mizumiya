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
- **UI/UX Design:** The application has evolved through several design iterations, currently featuring a "kawaii" (cute) aesthetic with pastel color palettes, decorative elements, and playful animations. This includes:
    - Kawaii pill-shaped bottom navigation with orange/yellow gradients.
    - Facebook-style simple layout for post creation with an avatar, rounded input, and photo icon.
    - Post cards redesigned to match a clean white card aesthetic with specific avatar styling, reaction layouts, and simple action buttons.
    - Stories section with a kawaii design, including pink pastel containers, decorative elements, and gender-based gradient color schemes for story cards.
    - Login and Signup interfaces with kawaii/cute aesthetics, featuring pink/beige backgrounds, decorative flowers, and cartoon mascots.
    - Custom kawaii component classes, pastel color system integration in Tailwind config, and kawaii animations (bounce-gentle, wiggle, float, kawaii-pulse, sparkle) are used throughout.

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