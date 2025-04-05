import React, { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { 
  UserCog, 
  Edit, 
  Trash2, 
  Shield, 
  User,
  Plus,
  FileBarChart
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ColumnDef } from "@tanstack/react-table";

interface StaffListProps {
  users: UserType[];
  isLoading?: boolean;
}

export function StaffList({ users, isLoading = false }: StaffListProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Delete user mutation
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Nhân viên đã được xóa",
        description: "Tài khoản nhân viên đã được xóa thành công.",
        variant: "success",
      });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi xóa nhân viên",
        description: error.message || "Đã xảy ra lỗi khi xóa tài khoản nhân viên.",
        variant: "destructive",
      });
    },
  });

  // Update user active status mutation
  const { mutate: updateUserStatus } = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PUT", `/api/users/${id}`, { active });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Trạng thái đã được cập nhật",
        description: "Trạng thái tài khoản đã được cập nhật thành công.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi cập nhật trạng thái",
        description: error.message || "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản.",
        variant: "destructive",
      });
    },
  });

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: "Quản trị viên", icon: <Shield className="h-4 w-4 mr-1 text-red-600" /> };
      case 'manager':
        return { label: "Quản lý", icon: <UserCog className="h-4 w-4 mr-1 text-blue-600" /> };
      case 'cashier':
        return { label: "Thu ngân", icon: <User className="h-4 w-4 mr-1 text-green-600" /> };
      case 'staff':
      default:
        return { label: "Nhân viên", icon: <User className="h-4 w-4 mr-1 text-gray-600" /> };
    }
  };

  // Define columns for data table
  const columns: ColumnDef<UserType>[] = [
    {
      accessorKey: "fullName",
      header: "Nhân viên",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
            <span className="font-medium">
              {row.original.fullName.split(" ").map(name => name[0]).join("").toUpperCase().substring(0, 2)}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium">{row.original.fullName}</div>
            <div className="text-xs text-neutral-500">@{row.original.username}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-sm">{row.original.email}</div>
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const { label, icon } = getRoleLabel(row.original.role);
        return (
          <div className="flex items-center">
            {icon}
            <span>{label}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "active",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Switch
            checked={row.original.active}
            onCheckedChange={(checked) => {
              if (row.original.id !== currentUser?.id) {
                updateUserStatus({ id: row.original.id, active: checked });
              } else {
                toast({
                  title: "Không thể thay đổi",
                  description: "Bạn không thể vô hiệu hóa tài khoản của chính mình.",
                  variant: "destructive",
                });
              }
            }}
            disabled={row.original.id === currentUser?.id}
          />
          <span className="ml-2 text-sm">
            {row.original.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}
          </span>
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/staff/${row.original.id}`)}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          {row.original.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserToDelete(row.original)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )
    }
  ];

  // Custom filter function for users
  const filterUsers = (data: UserType[], search: string) => {
    const lowerSearch = search.toLowerCase();
    return data.filter(user => 
      user.fullName.toLowerCase().includes(lowerSearch) ||
      user.username.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
    );
  };

  return (
    <>
      <Card className="mb-6 border border-neutral-300">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Danh sách nhân viên</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileBarChart className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button size="sm" onClick={() => navigate("/staff/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhân viên
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            searchPlaceholder="Tìm kiếm theo tên, username, email..."
            filterFunction={filterUsers}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản nhân viên "{userToDelete?.fullName}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (userToDelete) {
                  deleteUser(userToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
