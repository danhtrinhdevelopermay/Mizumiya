import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSession = async () => {
    setLoading(true);
    try {
      console.log("🔍 Checking session info...");
      
      // Check cookies in browser
      const cookies = document.cookie;
      console.log("🍪 Browser cookies:", cookies);
      
      // Make API call
      const response = await fetch("/api/debug/session", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        }
      });
      
      console.log("🔍 Session response status:", response.status);
      console.log("🔍 Session response headers:", [...response.headers.entries()]);
      
      const data = await response.json();
      setSessionInfo({
        ...data,
        browserCookies: cookies,
        status: response.status
      });
      
    } catch (error) {
      console.error("🔍 Session check error:", error);
      setSessionInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      console.log("🧪 Testing login...");
      
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: "test@example.com",
          password: "123456"
        }),
      });
      
      console.log("🧪 Login response:", response.status);
      const data = await response.json();
      console.log("🧪 Login data:", data);
      
      // Check session after login
      setTimeout(checkSession, 1000);
      
    } catch (error) {
      console.error("🧪 Login error:", error);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>🔍 Debug Session & Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkSession} disabled={loading}>
              {loading ? "Checking..." : "Check Session"}
            </Button>
            <Button onClick={testLogin} variant="outline">
              Test Login
            </Button>
          </div>
          
          {sessionInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <h3 className="font-bold mb-2">Session Info:</h3>
              <pre className="whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-xs text-gray-600">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Origin:</strong> {window.location.origin}</p>
            <p><strong>Domain:</strong> {window.location.hostname}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}