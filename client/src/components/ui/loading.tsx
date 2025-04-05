import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "medium", className = "" }: { size?: "small" | "medium" | "large", className?: string }) {
  const sizeMap = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeMap[size]} ${className}`} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="large" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <LoadingSpinner />
        <span className="text-lg">Đang xử lý...</span>
      </div>
    </div>
  );
}

export function LoadingSection() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner />
    </div>
  );
}
