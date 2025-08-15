import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  fileName?: string;
  message?: string;
}

export function UploadProgress({ progress, status, fileName, message }: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Đang tải lên...';
      case 'processing':
        return 'Đang xử lý...';
      case 'success':
        return 'Tải lên thành công!';
      case 'error':
        return 'Lỗi tải lên';
      default:
        return 'Đang chuẩn bị...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getStatusText()}
          </p>
          {fileName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {fileName}
            </p>
          )}
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {progress}%
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-2"
        />
        {/* Custom progress bar overlay */}
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {message && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {message}
        </p>
      )}
    </div>
  );
}