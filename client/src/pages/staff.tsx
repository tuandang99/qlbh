import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { StaffList } from "@/components/staff/staff-list";
import { StaffForm } from "@/components/staff/staff-form";
import { User } from "@shared/schema";
import { LoadingPage } from "@/components/ui/loading";

export default function Staff() {
  const [location] = useLocation();
  const isNew = location === "/staff/new";
  const isEdit = location.match(/^\/staff\/\d+$/);
  const userId = isEdit ? parseInt(location.split("/")[2]) : undefined;

  // Fetch staff (users)
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get the user for editing
  const user = userId && users ? users.find(u => u.id === userId) : undefined;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!users) {
    return <MainLayout>Failed to load staff data</MainLayout>;
  }

  return (
    <MainLayout 
      title={isNew ? "Thêm nhân viên mới" : isEdit ? "Chỉnh sửa nhân viên" : "Quản lý nhân viên"}
      requireAuth={true}
      allowedRoles={["admin", "manager"]}
    >
      {isNew || isEdit ? (
        <StaffForm 
          user={user} 
          isEdit={!!isEdit}
        />
      ) : (
        <StaffList users={users} />
      )}
    </MainLayout>
  );
}
