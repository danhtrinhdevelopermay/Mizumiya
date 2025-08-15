import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface DatabaseConnection {
  id: string;
  priority: number;
  isHealthy: boolean;
  isPrimary: boolean;
  consecutiveFailures: number;
  lastHealthCheck: string;
}

interface DatabaseStatus {
  status: string;
  timestamp: string;
  currentPrimary: string;
  totalConnections: number;
  healthyConnections: number;
  databases: DatabaseConnection[];
}

export default function AdminDatabaseStatus() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch database status
  const { data: dbStatus, isLoading, error } = useQuery({
    queryKey: ['/api/admin/database-status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Manual failover mutation
  const failoverMutation = useMutation({
    mutationFn: async (targetDatabase: string) => {
      const response = await fetch('/api/admin/database-failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDatabase }),
      });
      if (!response.ok) throw new Error('Failover failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-status'] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['/api/admin/database-status'] });
    setRefreshing(false);
  };

  const handleFailover = (targetDatabase: string) => {
    if (confirm(`Bạn có chắc chắn muốn chuyển sang database ${targetDatabase}?`)) {
      failoverMutation.mutate(targetDatabase);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Trạng thái Database</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải trạng thái database. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = dbStatus as DatabaseStatus;
  const healthPercentage = status ? (status.healthyConnections / status.totalConnections) * 100 : 0;
  const isSystemHealthy = status?.healthyConnections > 0;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-database-status">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Giám sát Database</h1>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái hệ thống</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isSystemHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-lg font-bold ${isSystemHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {isSystemHealthy ? 'Hoạt động bình thường' : 'Có vấn đề'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cập nhật: {status && format(new Date(status.timestamp), 'HH:mm:ss dd/MM/yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database đang hoạt động</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-healthy-count">
              {status?.healthyConnections || 0}/{status?.totalConnections || 0}
            </div>
            <Progress value={healthPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {healthPercentage.toFixed(1)}% hoạt động tốt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database chính</CardTitle>
            <Badge variant="default">Primary</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-primary-db">
              {status?.currentPrimary || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Database đang được sử dụng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Connections Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết các Database</CardTitle>
          <CardDescription>
            Trạng thái của từng database connection trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status?.databases?.map((db) => (
              <div
                key={db.id}
                className={`border rounded-lg p-4 ${
                  db.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                data-testid={`card-database-${db.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <span className="font-semibold">{db.id}</span>
                      {db.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                      <Badge 
                        variant={db.isHealthy ? "default" : "destructive"}
                        className={db.isHealthy ? "bg-green-100 text-green-800" : ""}
                      >
                        {db.isHealthy ? "Hoạt động" : "Lỗi"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Ưu tiên: {db.priority}
                    </span>
                    {!db.isPrimary && db.isHealthy && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFailover(db.id)}
                        disabled={failoverMutation.isPending}
                        data-testid={`button-failover-${db.id}`}
                      >
                        Chuyển đổi
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lỗi liên tiếp:</span>
                    <div className={`font-medium ${db.consecutiveFailures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {db.consecutiveFailures}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kiểm tra cuối:</span>
                    <div className="font-medium">
                      {format(new Date(db.lastHealthCheck), 'HH:mm:ss')}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <div className={`font-medium ${db.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {db.isHealthy ? "Tốt" : "Có vấn đề"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vai trò:</span>
                    <div className="font-medium">
                      {db.isPrimary ? "Chính" : "Dự phòng"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {!isSystemHealthy && (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cảnh báo:</strong> Hệ thống database đang gặp vấn đề. 
            Chỉ có {status?.healthyConnections} trong số {status?.totalConnections} database đang hoạt động bình thường.
          </AlertDescription>
        </Alert>
      )}

      {failoverMutation.isError && (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Không thể thực hiện chuyển đổi database. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {failoverMutation.isSuccess && (
        <Alert className="mt-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Đã khởi tạo chuyển đổi database thành công.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}