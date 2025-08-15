import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Archive, Trash2, Server, HardDrive, Cloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StorageStats {
  totalMessages: number;
  totalConversations: number;
  databaseSize: string;
  oldestMessage: string | null;
  newestMessage: string | null;
}

export default function StorageManagementPage() {
  const [archiveDays, setArchiveDays] = useState(30);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: storageStats, isLoading } = useQuery<StorageStats>({
    queryKey: ["/api/admin/storage-stats"],
  });

  const archiveMessagesMutation = useMutation({
    mutationFn: async (daysOld: number) => {
      const response = await fetch("/api/admin/archive-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysOld }),
      });
      if (!response.ok) throw new Error('Failed to archive messages');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lưu trữ thành công",
        description: `Đã lưu trữ ${data.archivedCount} tin nhắn từ ${data.conversationsAffected} cuộc trò chuyện`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/storage-stats"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu trữ tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleArchiveMessages = () => {
    if (confirm(`Bạn có chắc muốn lưu trữ tất cả tin nhắn cũ hơn ${archiveDays} ngày?`)) {
      archiveMessagesMutation.mutate(archiveDays);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải thống kê...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quản lý lưu trữ</h1>
          <p className="text-gray-400">
            Theo dõi và quản lý dung lượng lưu trữ của ứng dụng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Database Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Tin nhắn trong Database
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {storageStats?.totalMessages.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-400">
                Trong {storageStats?.totalConversations || 0} cuộc trò chuyện
              </p>
            </CardContent>
          </Card>

          {/* Database Size */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Dung lượng Database
              </CardTitle>
              <HardDrive className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {storageStats?.databaseSize || '0 KB'}
              </div>
              <p className="text-xs text-gray-400">
                Ước tính dung lượng tin nhắn
              </p>
            </CardContent>
          </Card>

          {/* External Storage */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Lưu trữ ngoài
              </CardTitle>
              <Cloud className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                Firebase/JSON
              </div>
              <p className="text-xs text-gray-400">
                Backup & Archive
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Archive Management */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Lưu trữ tin nhắn cũ
            </CardTitle>
            <CardDescription className="text-gray-400">
              Di chuyển tin nhắn cũ sang lưu trữ ngoài để tiết kiệm dung lượng database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-200 whitespace-nowrap">
                Lưu trữ tin nhắn cũ hơn:
              </label>
              <select
                value={archiveDays}
                onChange={(e) => setArchiveDays(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={60}>60 ngày</option>
                <option value={90}>90 ngày</option>
                <option value={365}>1 năm</option>
              </select>
              <Button
                onClick={handleArchiveMessages}
                disabled={archiveMessagesMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {archiveMessagesMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Đang lưu trữ...
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Bắt đầu lưu trữ
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-400 bg-gray-700 p-3 rounded-lg">
              <strong className="text-white">Lưu ý:</strong> Tin nhắn được lưu trữ sẽ được chuyển sang 
              Firebase/JSON storage và xóa khỏi database chính để tiết kiệm dung lượng. 
              Quá trình này không thể hoàn tác.
            </div>
          </CardContent>
        </Card>

        {/* Storage Timeline */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5" />
              Dòng thời gian lưu trữ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <div>
                <div className="text-white font-medium">Tin nhắn cũ nhất</div>
                <div className="text-gray-400 text-sm">
                  {storageStats?.oldestMessage 
                    ? new Date(storageStats.oldestMessage).toLocaleDateString('vi-VN')
                    : 'Không có dữ liệu'
                  }
                </div>
              </div>
              <div>
                <div className="text-white font-medium">Tin nhắn mới nhất</div>
                <div className="text-gray-400 text-sm">
                  {storageStats?.newestMessage 
                    ? new Date(storageStats.newestMessage).toLocaleDateString('vi-VN')
                    : 'Không có dữ liệu'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Strategy Explanation */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Chiến lược lưu trữ hybrid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-300">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong className="text-white">PostgreSQL Database:</strong> Lưu trữ tin nhắn gần đây (thường dưới 30 ngày) 
                để truy cập nhanh và tìm kiếm hiệu quả.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong className="text-white">Firebase/JSON Storage:</strong> Lưu trữ tin nhắn cũ và backup. 
                15GB miễn phí với Firebase, có thể mở rộng khi cần.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <strong className="text-white">Cloudinary:</strong> Lưu trữ media files (ảnh, video) 
                trong tin nhắn với tối ưu hóa băng thông.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}