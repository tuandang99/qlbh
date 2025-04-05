import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { InventoryStatus } from "@/components/dashboard/inventory-status";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { DashboardData, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();

  // Get current time of day
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "buổi sáng";
    if (hour < 18) return "buổi chiều";
    return "buổi tối";
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  // Fetch categories for inventory status
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <MainLayout title="Tổng quan">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold">Chào {getTimeOfDay()}, {user?.fullName}</h1>
          <div className="flex items-center space-x-3">
            <select className="appearance-none py-2 pl-3 pr-10 rounded-md border border-neutral-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white">
              <option>Hôm nay</option>
              <option>Tuần này</option>
              <option>Tháng này</option>
              <option>Quý này</option>
            </select>
            <Button className="flex items-center py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark text-sm">
              <span className="material-icons text-sm mr-1">+</span>
              <span>Tạo báo cáo</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Doanh thu hôm nay"
            value={dashboardData ? 
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(dashboardData.stats.revenue) : 
              "0 đ"}
            trend={{ value: "12.5% so với hôm qua", isPositive: true }}
            variant="revenue"
            isLoading={isLoadingDashboard}
          />
          
          <StatCard
            title="Đơn hàng hôm nay"
            value={dashboardData?.stats.orders || 0}
            trend={{ value: "8.2% so với hôm qua", isPositive: true }}
            variant="orders"
            isLoading={isLoadingDashboard}
          />
          
          <StatCard
            title="Khách hàng mới"
            value={dashboardData?.stats.newCustomers || 0}
            trend={{ value: "3.1% so với hôm qua", isPositive: false }}
            variant="customers"
            isLoading={isLoadingDashboard}
          />
          
          <StatCard
            title="Lợi nhuận hôm nay"
            value={dashboardData ? 
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(dashboardData.stats.profit) : 
              "0 đ"}
            trend={{ value: "5.7% so với hôm qua", isPositive: true }}
            variant="profit"
            isLoading={isLoadingDashboard}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <SalesChart 
              data={dashboardData?.salesByDay || []}
              isLoading={isLoadingDashboard}
            />
          </div>

          {/* Recent Activity */}
          <Card className="border border-neutral-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
                <Button variant="ghost" className="text-primary text-sm">
                  Xem tất cả
                </Button>
              </div>
              <div className="space-y-4">
                {isLoadingDashboard ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-neutral-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  dashboardData?.recentActivities.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="mt-6">
          <RecentOrders 
            orders={dashboardData?.recentOrders || []}
            isLoading={isLoadingDashboard} 
          />
        </div>

        {/* Inventory Status */}
        <div className="mt-6">
          <InventoryStatus 
            products={dashboardData?.lowStockProducts || []} 
            categories={categories || []}
            isLoading={isLoadingDashboard}
          />
        </div>
      </div>
    </MainLayout>
  );
}
