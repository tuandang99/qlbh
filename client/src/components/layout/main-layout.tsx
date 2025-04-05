import { useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/lib/auth.tsx";
import { LoadingPage } from "@/components/ui/loading";
import { useMobile } from "@/hooks/use-mobile";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
};

export function MainLayout({
  children,
  title = "Quản Lý Bán Hàng",
  requireAuth = true,
  allowedRoles = [],
}: MainLayoutProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Check if the user has the required role
  const hasRequiredRole = !allowedRoles.length || 
    (user && allowedRoles.includes(user.role));

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requireAuth && !hasRequiredRole) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-200">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          title={title} 
          onOpenMobileMenu={() => setIsSidebarOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
