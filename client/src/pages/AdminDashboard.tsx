import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Shield, Users, Key, Search, Trash2, UserPlus, Image, Crown, Database } from "lucide-react";
import { Link } from "wouter";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";

export default function AdminDashboard() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [badgeImageUrl, setBadgeImageUrl] = useState("");
  const [selectedUserForBadge, setSelectedUserForBadge] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin authentication
  const handleAdminLogin = () => {
    // Simple admin password check (you can enhance this)
    if (adminPassword === "admin123") {
      setIsAuthenticated(true);
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng Admin!"
      });
    } else {
      toast({
        title: "Lỗi đăng nhập",
        description: "Sai mật khẩu admin",
        variant: "destructive"
      });
    }
  };

  // Get all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  // Reset user password mutation  
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string, newPassword: string }) => {
      const response = await fetch(`/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã reset password cho user"
      });
      setNewPassword("");
      setSelectedUserId("");
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể reset password",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công", 
        description: "Đã xóa user"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa user",
        variant: "destructive"
      });
    }
  });

  // Update user badge mutation
  const updateBadgeMutation = useMutation({
    mutationFn: async ({ userId, badgeImageUrl }: { userId: string, badgeImageUrl: string }) => {
      const response = await fetch(`/api/admin/update-badge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, badgeImageUrl })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật badge cho user"
      });
      setBadgeImageUrl("");
      setSelectedUserForBadge("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Lỗi", 
        description: "Không thể cập nhật badge",
        variant: "destructive"
      });
    }
  });

  // Filter users based on search
  const filteredUsers = users.filter((user: User) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Mật khẩu Admin</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Nhập mật khẩu admin"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Đăng nhập
            </Button>
            <Alert>
              <AlertDescription>
                <strong>Lưu ý:</strong> Password được lưu dạng văn bản thuần để admin dễ quản lý.
                Admin có thể xem và thay đổi password của user.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý users và hệ thống
          </p>
          
          {/* Quick Links */}
          <div className="mt-6 flex gap-4 flex-wrap">
            <Link 
              href="/admin/beauty-contest" 
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Crown className="h-4 w-4" />
              Quản lý Beauty Contest
            </Link>
            <Link 
              href="/admin/storage" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Database className="h-4 w-4" />
              Quản lý lưu trữ
            </Link>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quản lý Users
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm user theo tên, email, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Danh sách Users ({filteredUsers.length})</span>
                  <Badge variant="secondary">
                    Total: {users.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Đang tải...</div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">
                              <UserNameWithBadge 
                                firstName={user.firstName}
                                lastName={user.lastName}
                                badgeImageUrl={user.badgeImageUrl}
                              />
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{user.username} • {user.email}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={user.isOnline ? "default" : "secondary"}>
                                  {user.isOnline ? "Online" : "Offline"}
                                </Badge>
                                <Badge variant={user.isEmailVerified ? "default" : "destructive"}>
                                  {user.isEmailVerified ? "Email verified" : "Email not verified"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <strong>Password:</strong> {user.password}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              Reset Password
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Image className="h-4 w-4 mr-1" />
                                  Badge
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cập nhật Badge cho {user.firstName} {user.lastName}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="badgeUrl">URL ảnh badge</Label>
                                    <Input
                                      id="badgeUrl"
                                      placeholder="https://example.com/badge.png"
                                      value={selectedUserForBadge === user.id ? badgeImageUrl : user.badgeImageUrl || ""}
                                      onChange={(e) => {
                                        setSelectedUserForBadge(user.id);
                                        setBadgeImageUrl(e.target.value);
                                      }}
                                    />
                                  </div>
                                  {(selectedUserForBadge === user.id ? badgeImageUrl : user.badgeImageUrl) && (
                                    <div>
                                      <Label>Preview:</Label>
                                      <img 
                                        src={selectedUserForBadge === user.id ? badgeImageUrl : user.badgeImageUrl}
                                        alt="Badge preview"
                                        className="w-8 h-8 rounded object-cover mt-2"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => {
                                        updateBadgeMutation.mutate({
                                          userId: user.id,
                                          badgeImageUrl: selectedUserForBadge === user.id ? badgeImageUrl : user.badgeImageUrl || ""
                                        });
                                      }}
                                      disabled={updateBadgeMutation.isPending}
                                    >
                                      {updateBadgeMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        updateBadgeMutation.mutate({
                                          userId: user.id,
                                          badgeImageUrl: ""
                                        });
                                      }}
                                      disabled={updateBadgeMutation.isPending}
                                    >
                                      Xóa Badge
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {selectedUserId === user.id && (
                          <div className="border-t pt-3 space-y-3">
                            <Label>Reset Password cho {user.username}</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nhập password mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                type="password"
                              />
                              <Button
                                onClick={() => resetPasswordMutation.mutate({
                                  userId: user.id,
                                  newPassword
                                })}
                                disabled={!newPassword || resetPasswordMutation.isPending}
                              >
                                {resetPasswordMutation.isPending ? "Đang reset..." : "Reset"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId("");
                                  setNewPassword("");
                                }}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Bảo mật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hệ thống bảo mật hiện tại:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Password được lưu dạng văn bản thuần</li>
                      <li>• Admin có thể xem và thay đổi password user</li>
                      <li>• Session được quản lý an toàn</li>
                      <li>• <strong>CẢNH BÁO:</strong> Không mã hóa password có thể gây rủi ro bảo mật</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Cảnh báo bảo mật:</strong>
                    <br />
                    Password không được mã hóa có thể bị lộ nếu database bị hack. 
                    Khuyến nghị chỉ sử dụng cho môi trường test/development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}