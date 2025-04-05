import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileMenuButton } from "./sidebar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  title: string;
  onOpenMobileMenu: () => void;
};

export function Header({ title, onOpenMobileMenu }: HeaderProps) {
  const [location] = useLocation();
  const [hasNotifications] = useState(true);

  const pathToTitle = (path: string): string => {
    if (path === "/dashboard") return "Tổng quan";
    if (path === "/products") return "Sản phẩm";
    if (path.startsWith("/products/")) return "Chi tiết sản phẩm";
    if (path === "/orders") return "Đơn hàng";
    if (path === "/orders/new") return "Bán hàng";
    if (path.startsWith("/orders/")) return "Chi tiết đơn hàng";
    if (path === "/customers") return "Khách hàng";
    if (path.startsWith("/customers/")) return "Chi tiết khách hàng";
    if (path === "/inventory") return "Tồn kho";
    if (path === "/suppliers") return "Nhà cung cấp";
    if (path.startsWith("/suppliers/")) return "Chi tiết nhà cung cấp";
    if (path === "/staff") return "Nhân viên";
    if (path.startsWith("/staff/")) return "Chi tiết nhân viên";
    if (path === "/reports") return "Báo cáo";
    if (path === "/settings") return "Cài đặt";
    return title;
  };

  // Mock notifications for demonstration
  const notifications = [
    { id: 1, text: "Đơn hàng mới #12468", time: "15 phút trước" },
    { id: 2, text: "Cảnh báo tồn kho: Áo thun nam size L", time: "45 phút trước" },
    { id: 3, text: "Đơn hàng #12466 hoàn thành", time: "1 giờ trước" },
  ];

  return (
    <header className="bg-white border-b border-neutral-300 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <MobileMenuButton onClick={onOpenMobileMenu} />
          <div className="text-xl font-semibold hidden md:block">{pathToTitle(location)}</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500 h-4 w-4 mt-2.5" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              className="py-2 pl-10 pr-4 rounded-md border border-neutral-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm w-48 md:w-64"
            />
          </div>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-4 py-2 font-medium border-b">Thông báo</div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="p-3 focus:bg-neutral-100 cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">{notification.text}</div>
                        <div className="text-xs text-neutral-500 mt-1">{notification.time}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full">
                    Xem tất cả
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
