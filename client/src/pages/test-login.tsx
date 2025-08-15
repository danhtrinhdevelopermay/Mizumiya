import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestLogin() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const clearCookies = async () => {
    try {
      await fetch("/api/auth/clear-cookies", {
        method: "POST",
        credentials: "include",
      });
      console.log("🧹 Cookies cleared");
    } catch (err) {
      console.error("Failed to clear cookies:", err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setResult("");
    
    try {
      // Clear old cookies first
      await clearCookies();
      console.log("🧪 Testing login with:", { email, password });
      
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      
      console.log("🧪 Login response status:", response.status);
      console.log("🧪 Login response headers:", [...response.headers.entries()]);
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Đăng nhập thành công! User: ${data.user.username}`);
        console.log("🧪 Login success:", data);
        
        // Test API calls with session
        setTimeout(async () => {
          try {
            // Test user API
            const meResponse = await fetch("/api/users/me", {
              credentials: "include",
            });
            console.log("🧪 /api/users/me status:", meResponse.status);
            
            if (meResponse.ok) {
              const userData = await meResponse.json();
              setResult(prev => prev + `\n✅ User API thành công! User: ${userData.username}`);
              
              // Test posts feed API
              const postsResponse = await fetch("/api/posts/feed", {
                credentials: "include",
              });
              console.log("🧪 /api/posts/feed status:", postsResponse.status);
              
              if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                setResult(prev => prev + `\n✅ Posts API thành công! Có ${postsData.length} bài viết`);
                
                // Redirect to home page after successful login
                setTimeout(() => {
                  window.location.href = '/';
                }, 1000);
              } else {
                setResult(prev => prev + `\n❌ Posts API thất bại: ${postsResponse.status}`);
              }
            } else {
              setResult(prev => prev + `\n❌ User API thất bại: ${meResponse.status}`);
            }
          } catch (err) {
            setResult(prev => prev + `\n❌ API test lỗi: ${err}`);
          }
        }, 1000);
      } else {
        setResult(`❌ Đăng nhập thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("🧪 Login error:", error);
      setResult(`❌ Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestUser = () => {
    setEmail("danhtrinh.official@gmail.com");
    setPassword("danhtrinh.official@gmail.com");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🧪 Test Đăng Nhập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleLogin} disabled={loading} className="flex-1">
              {loading ? "Đang test..." : "Test Đăng Nhập"}
            </Button>
            <Button onClick={handleTestUser} variant="outline">
              User có sẵn
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm whitespace-pre-line">
              {result}
            </div>
          )}
          
          <div className="text-xs text-gray-600 mt-4">
            <p><strong>Accounts có sẵn:</strong></p>
            <p>• test@example.com / 123456</p>
            <p>• danhtrinh.official@gmail.com / danhtrinh.official@gmail.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}