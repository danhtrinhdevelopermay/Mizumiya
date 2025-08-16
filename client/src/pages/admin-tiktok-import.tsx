import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  ExternalLink,
  Play,
  Music
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface TikTokImportResult {
  success: boolean;
  message: string;
  accountCreated?: boolean;
  postCreated?: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  post?: {
    id: string;
    title: string;
    videoUrl: string;
  };
  error?: string;
}

interface TikTokImport {
  id: string;
  tiktokVideoId: string;
  originalUrl: string;
  postId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    tiktokUsername: string;
    displayName: string;
    avatar?: string;
    appUserId?: string;
  };
}

export default function AdminTikTokImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [importResult, setImportResult] = useState<TikTokImportResult | null>(null);

  // Fetch import history
  const { data: importsData, isLoading: importsLoading } = useQuery<{ success: boolean; imports: TikTokImport[] }>({
    queryKey: ["/api/tiktok/admin/imports"],
  });
  
  const imports = importsData?.imports || [];

  // Import video mutation
  const importMutation = useMutation({
    mutationFn: async (url: string): Promise<TikTokImportResult> => {
      console.log("🎬 Starting TikTok import for URL:", url);
      
      const response = await fetch("/api/tiktok/admin/import", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "credentials": "include"
        },
        credentials: "include",
        body: JSON.stringify({ url }),
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Request failed:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
      }
      
      const result = await response.json() as TikTokImportResult;
      console.log("✅ Import result:", result);
      
      return result;
    },
    onSuccess: (data: TikTokImportResult) => {
      setImportResult(data);
      if (data.success) {
        toast({
          title: "✅ Import thành công",
          description: data.message,
        });
        setTiktokUrl("");
        queryClient.invalidateQueries({ queryKey: ["/api/tiktok/admin/imports"] });
      } else {
        toast({
          title: "❌ Import thất bại",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("🚨 Import mutation error:", error);
      console.error("Error stack:", error?.stack);
      
      const errorMessage = error?.message || "Import thất bại - lỗi không xác định";
      
      toast({
        title: "❌ Lỗi Import",
        description: errorMessage,
        variant: "destructive",
      });
      
      setImportResult({
        success: false,
        message: errorMessage,
        error: errorMessage
      });
    },
  });

  const handleImport = () => {
    if (!tiktokUrl.trim()) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng nhập URL TikTok",
        variant: "destructive",
      });
      return;
    }

    // Validate TikTok URL - more comprehensive pattern
    const tiktokUrlPattern = /(tiktok\.com|vm\.tiktok\.com)/i;
    if (!tiktokUrlPattern.test(tiktokUrl)) {
      toast({
        title: "❌ URL không hợp lệ",
        description: "Vui lòng nhập URL TikTok hợp lệ (ví dụ: https://www.tiktok.com/@username/video/...)",
        variant: "destructive",
      });
      return;
    }

    setImportResult(null);
    importMutation.mutate(tiktokUrl);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="h-8 w-8" />
            TikTok Import System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Import videos từ TikTok và tự động tạo tài khoản + đăng bài
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Import Video từ TikTok
                </CardTitle>
                <CardDescription>
                  Nhập URL TikTok để tự động tạo tài khoản và đăng video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tiktok-url">URL TikTok</Label>
                  <Input
                    id="tiktok-url"
                    type="url"
                    placeholder="https://www.tiktok.com/@username/video/..."
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleImport()}
                  />
                </div>
                
                <Button 
                  onClick={handleImport} 
                  disabled={importMutation.isPending}
                  className="w-full"
                >
                  {importMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Video
                    </>
                  )}
                </Button>

                {importMutation.isPending && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Đang xử lý...</div>
                    <Progress value={66} className="w-full" />
                    <div className="text-xs text-gray-500">
                      Đang tải video và tạo tài khoản...
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <Alert className={importResult.success ? "border-green-200" : "border-red-200"}>
                    <div className="flex items-start gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="font-medium mb-2">{importResult.message}</div>
                          
                          {importResult.success && importResult.user && importResult.post && (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>Tài khoản: {importResult.user.displayName} (@{importResult.user.username})</span>
                                {importResult.accountCreated && (
                                  <Badge variant="secondary" className="text-xs">MỚI</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Play className="h-3 w-3" />
                                <span>Bài viết: {importResult.post.title}</span>
                              </div>
                            </div>
                          )}
                          
                          {importResult.error && (
                            <div className="text-red-600 text-sm mt-2">
                              Chi tiết lỗi: {importResult.error}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tổng imports:</span>
                  <span className="font-medium">{imports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Thành công:</span>
                  <span className="font-medium text-green-600">
                    {imports.filter(i => i.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Thất bại:</span>
                  <span className="font-medium text-red-600">
                    {imports.filter(i => i.status === 'failed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Đang xử lý:</span>
                  <span className="font-medium text-blue-600">
                    {imports.filter(i => i.status === 'processing').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hướng dẫn</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Copy URL video TikTok bất kỳ</p>
                <p>• Hệ thống sẽ tự động:</p>
                <p className="pl-4">- Tạo tài khoản từ profile TikTok</p>
                <p className="pl-4">- Tải video về</p>
                <p className="pl-4">- Đăng bài với mô tả gốc</p>
                <p>• Nếu tài khoản đã tồn tại, chỉ đăng video mới</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Import History */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Lịch sử Import
              </CardTitle>
              <CardDescription>
                Danh sách các video đã import từ TikTok
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tải...</span>
                </div>
              ) : imports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có video nào được import</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TikTok Account</TableHead>
                      <TableHead>Video ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((importItem) => (
                      <TableRow key={importItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {importItem.account.avatar && (
                              <img 
                                src={importItem.account.avatar} 
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <div className="font-medium">@{importItem.account.tiktokUsername}</div>
                              <div className="text-sm text-gray-500">{importItem.account.displayName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {importItem.tiktokVideoId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(importItem.status)}
                            <Badge className={getStatusColor(importItem.status)}>
                              {importItem.status}
                            </Badge>
                          </div>
                          {importItem.errorMessage && (
                            <div className="text-xs text-red-500 mt-1">
                              {importItem.errorMessage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(importItem.createdAt), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={importItem.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                TikTok
                              </a>
                            </Button>
                            {importItem.postId && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a href={`/posts/${importItem.postId}`}>
                                  <Play className="h-3 w-3 mr-1" />
                                  Xem bài
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}