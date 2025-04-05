import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

// Import icons
import {
  Store,
  ShoppingCart,
  PackageOpen,
  Receipt,
  Users,
  ShoppingBag,
  Truck,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  LogOut
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
};

type SidebarProps = {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Tổng quan",
      path: "/dashboard",
      icon: <Store className="mr-3 h-5 w-5" />,
    },
    {
      label: "Bán hàng",
      path: "/orders/new",
      icon: <ShoppingCart className="mr-3 h-5 w-5" />,
    },
    {
      label: "Sản phẩm",
      path: "/products",
      icon: <PackageOpen className="mr-3 h-5 w-5" />,
    },
    {
      label: "Đơn hàng",
      path: "/orders",
      icon: <Receipt className="mr-3 h-5 w-5" />,
    },
    {
      label: "Khách hàng",
      path: "/customers",
      icon: <Users className="mr-3 h-5 w-5" />,
    },
    {
      label: "Tồn kho",
      path: "/inventory",
      icon: <ShoppingBag className="mr-3 h-5 w-5" />,
    },
    {
      label: "Nhà cung cấp",
      path: "/suppliers",
      icon: <Truck className="mr-3 h-5 w-5" />,
    },
    {
      label: "Nhân viên",
      path: "/staff",
      icon: <UserCog className="mr-3 h-5 w-5" />,
      roles: ["admin", "manager"],
    },
    {
      label: "Báo cáo",
      path: "/reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      roles: ["admin", "manager"],
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  // For mobile, we need to close the sidebar when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, isOpen]);

  const sidebarClasses = cn(
    "sidebar fixed h-full bg-white shadow-lg border-r border-neutral-300 z-50 flex flex-col transition-all duration-300 ease-in-out",
    isMobile ? (isOpen ? "transform-none w-64" : "-translate-x-full w-64") : "w-64 static"
  );

  // Close button for mobile
  const MobileCloseButton = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="absolute right-2 top-2 md:hidden" 
      onClick={onClose}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );

  return (
    <>
      {/* Overlay when mobile sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={sidebarClasses}>
        {isMobile && <MobileCloseButton />}
        
        <div className="p-4 border-b border-neutral-300">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-primary text-white mr-3">
              <Store size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">Quản Lý Bán Hàng</h1>
              <p className="text-xs text-neutral-500">Phiên bản 1.0.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location === item.path || 
                              (item.path !== "/dashboard" && location.startsWith(item.path));
              
              return (
                <div 
                  key={item.path}
                  className={cn(
                    isActive 
                      ? "bg-primary-light/10 text-primary rounded-md" 
                      : "text-neutral-700 hover:bg-neutral-200 rounded-md"
                  )}
                >
                  <Link href={item.path}>
                    <a 
                      className="flex items-center px-3 py-2.5 rounded-md"
                      onClick={handleLinkClick}
                    >
                      {item.icon}
                      <span className={cn("font-medium", isActive && "font-medium")}>
                        {item.label}
                      </span>
                    </a>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-neutral-300">
          <div>
            <Link href="/settings">
              <a 
                className="flex items-center px-3 py-2 rounded-md hover:bg-neutral-200"
                onClick={handleLinkClick}
              >
                <Settings className="mr-3 h-5 w-5 text-neutral-600" />
                <span>Cài đặt</span>
              </a>
            </Link>
          </div>
          
          {user && (
            <>
              <div className="flex items-center mt-4 pt-4 border-t border-neutral-300">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="font-medium">
                    {user.fullName?.split(" ").map(name => name[0]).join("").toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm">{user.fullName}</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                onClick={() => {
                  logout();
                  handleLinkClick();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

type MobileMenuButtonProps = {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden" 
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
