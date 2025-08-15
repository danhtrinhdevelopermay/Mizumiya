import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, SignUpUser, SignInUser } from "@shared/schema";

interface AuthResponse {
  user: User;
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user with proper error handling
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async (): Promise<User | null> => {
      console.log("🔄 Fetching user authentication status...");
      
      // Check for recent login/signup success markers
      const loginSuccess = sessionStorage.getItem('loginSuccess');
      const signupSuccess = sessionStorage.getItem('signupSuccess');
      const loginTime = sessionStorage.getItem('loginTime');
      const signupTime = sessionStorage.getItem('signupTime');
      
      // Check URL parameters for authentication indicators
      const urlParams = new URLSearchParams(window.location.search);
      const authenticatedParam = urlParams.get('authenticated');
      
      let shouldCleanupMarkers = false;
      
      if (loginSuccess || signupSuccess || authenticatedParam) {
        const timestamp = loginTime || signupTime || Date.now().toString();
        const timeDiff = Date.now() - parseInt(timestamp);
        if (timeDiff < 60000) { // Extended to 60 seconds for production stability
          console.log("🎯 Recent login/signup detected, forcing fresh auth check");
          console.log("📍 Authentication markers found");
          shouldCleanupMarkers = true;
        }
        
        // Clean URL if it has auth parameters
        if (authenticatedParam && window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }
      }
      
      const response = await fetch("/api/users/me", {
        credentials: 'include',
        cache: 'no-store', // Force fresh request
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.status === 401) {
        console.log("❌ User not authenticated (401)");
        // Only cleanup markers if authentication definitively failed
        if (shouldCleanupMarkers) {
          sessionStorage.removeItem('loginSuccess');
          sessionStorage.removeItem('signupSuccess');
          sessionStorage.removeItem('loginTime');
          sessionStorage.removeItem('signupTime');
          sessionStorage.removeItem('redirectTo');
        }
        return null; // Not authenticated, return null instead of throwing
      }
      
      if (!response.ok) {
        console.log("❌ Failed to fetch user:", response.status, response.statusText);
        throw new Error("Failed to fetch user");
      }
      
      const userData = await response.json();
      console.log("✅ User authenticated:", userData?.username);
      
      // Only cleanup markers after successful authentication
      if (shouldCleanupMarkers) {
        sessionStorage.removeItem('loginSuccess');
        sessionStorage.removeItem('signupSuccess');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('signupTime');
        sessionStorage.removeItem('redirectTo');
      }
      
      return userData;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Enable refetch on focus for production
    staleTime: 0, // Always fresh for authentication
    gcTime: 1 * 60 * 1000, // Cache for 1 minute
  });

  // Sign up mutation
  const signUp = useMutation({
    mutationFn: async (userData: SignUpUser): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sign up");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      // Set user data immediately in cache
      queryClient.setQueryData(["/api/users/me"], data.user);
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  // Sign in mutation
  const signIn = useMutation({
    mutationFn: async (credentials: SignInUser): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sign in");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      // Set user data immediately in cache
      queryClient.setQueryData(["/api/users/me"], data.user);
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  // Sign out mutation
  const signOut = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to sign out");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/users/me"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isError: isError && !user,
    signUp,
    signIn,
    signOut,
  };
}