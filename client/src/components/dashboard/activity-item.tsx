import React from "react";
import { ActivityLog } from "@shared/schema";
import { Calendar, Check, Package, User, AlertTriangle } from "lucide-react";

interface ActivityItemProps {
  activity: ActivityLog;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Function to determine icon and color based on activity action
  const getActivityVisuals = (action: string) => {
    if (action.includes("Order") || action.includes("Đơn hàng")) {
      return {
        icon: <Package className="text-sm" />,
        bgColor: "bg-primary-light/10 text-primary",
      };
    } else if (action.includes("Customer") || action.includes("Khách hàng")) {
      return {
        icon: <User className="text-sm" />,
        bgColor: "bg-indigo-100 text-indigo-600",
      };
    } else if (action.includes("completed") || action.includes("hoàn thành")) {
      return {
        icon: <Check className="text-sm" />,
        bgColor: "bg-emerald-100 text-emerald-600",
      };
    } else if (action.includes("cảnh báo") || action.includes("warning") || action.includes("Alert")) {
      return {
        icon: <AlertTriangle className="text-sm" />,
        bgColor: "bg-amber-100 text-amber-600",
      };
    } else {
      return {
        icon: <Calendar className="text-sm" />,
        bgColor: "bg-neutral-100 text-neutral-600",
      };
    }
  };

  const { icon, bgColor } = getActivityVisuals(activity.action);
  
  // Format the timestamp to a human-readable format
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Format date for older activities
    return activityTime.toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-start">
      <div className={`p-2 rounded-full ${bgColor} mr-3`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{activity.action}</p>
        <p className="text-xs text-neutral-500">{activity.details}</p>
        <p className="text-xs text-neutral-500">{formatTimeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}
