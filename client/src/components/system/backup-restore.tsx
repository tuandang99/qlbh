import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BackupLog } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { LoadingOverlay, LoadingSection } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Check, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

// Schema for backup form
const backupFormSchema = z.object({
  filename: z.string().min(1, "Tên tệp tin là bắt buộc"),
  notes: z.string().optional(),
});

// Schema for restore form
const restoreFormSchema = z.object({
  filename: z.string().min(1, "Tên tệp tin là bắt buộc"),
  notes: z.string().optional(),
});

export function BackupRestore() {
  const [activeTab, setActiveTab] = useState<"backup" | "restore" | "history">("backup");

  // Fetch backup history
  const { data: backupLogs, isLoading } = useQuery<BackupLog[]>({
    queryKey: ["/api/backups"],
  });

  // Initialize backup form
  const backupForm = useForm<z.infer<typeof backupFormSchema>>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      filename: `backup_${new Date().toISOString().split('T')[0]}.json`,
      notes: "",
    },
  });

  // Initialize restore form
  const restoreForm = useForm<z.infer<typeof restoreFormSchema>>({
    resolver: zodResolver(restoreFormSchema),
    defaultValues: {
      filename: "",
      notes: "",
    },
  });

  // Backup mutation
  const { mutate: performBackup, isPending: isBackingUp } = useMutation({
    mutationFn: async (data: z.infer<typeof backupFormSchema>) => {
      return apiRequest("POST", "/api/backup", { ...data, type: "backup" });
    },
    onSuccess: async () => {
      toast({
        title: "Sao lưu thành công",
        description: "Dữ liệu đã được sao lưu thành công.",
        variant: "success",
      });
      backupForm.reset({
        filename: `backup_${new Date().toISOString().split('T')[0]}.json`,
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi sao lưu",
        description: error.message || "Đã xảy ra lỗi khi sao lưu dữ liệu.",
        variant: "destructive",
      });
    },
  });

  // Restore mutation
  const { mutate: performRestore, isPending: isRestoring } = useMutation({
    mutationFn: async (data: z.infer<typeof restoreFormSchema>) => {
      return apiRequest("POST", "/api/backup", { ...data, type: "restore" });
    },
    onSuccess: async () => {
      toast({
        title: "Khôi phục thành công",
        description: "Dữ liệu đã được khôi phục thành công.",
        variant: "success",
      });
      restoreForm.reset({
        filename: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khôi phục",
        description: error.message || "Đã xảy ra lỗi khi khôi phục dữ liệu.",
        variant: "destructive",
      });
    },
  });

  // Handle backup submission
  const onBackupSubmit = (data: z.infer<typeof backupFormSchema>) => {
    performBackup(data);
  };

  // Handle restore submission
  const onRestoreSubmit = (data: z.infer<typeof restoreFormSchema>) => {
    performRestore(data);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Define columns for backup history table
  const columns: ColumnDef<BackupLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Thời gian",
      cell: ({ row }) => <span>{formatDate(row.original.timestamp)}</span>
    },
    {
      accessorKey: "filename",
      header: "Tên tệp tin",
      cell: ({ row }) => <span className="font-medium">{row.original.filename}</span>
    },
    {
      accessorKey: "type",
      header: "Loại",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "backup" ? "secondary" : "primary"}>
          {row.original.type === "backup" ? "Sao lưu" : "Khôi phục"}
        </Badge>
      )
    },
    {
      accessorKey: "success",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.success ? (
            <Badge variant="success" className="flex items-center">
              <Check className="h-3 w-3 mr-1" /> Thành công
            </Badge>
          ) : (
            <Badge variant="danger" className="flex items-center">
              <X className="h-3 w-3 mr-1" /> Thất bại
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "notes",
      header: "Ghi chú",
      cell: ({ row }) => <span>{row.original.notes || "—"}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-neutral-300 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "backup"
              ? "text-primary border-b-2 border-primary"
              : "text-neutral-600 hover:text-primary"
          }`}
          onClick={() => setActiveTab("backup")}
        >
          Sao lưu dữ liệu
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "restore"
              ? "text-primary border-b-2 border-primary"
              : "text-neutral-600 hover:text-primary"
          }`}
          onClick={() => setActiveTab("restore")}
        >
          Khôi phục dữ liệu
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "history"
              ? "text-primary border-b-2 border-primary"
              : "text-neutral-600 hover:text-primary"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Lịch sử sao lưu
        </button>
      </div>

      {activeTab === "backup" && (
        <div className="relative">
          {isBackingUp && <LoadingOverlay />}
          
          <Card className="border border-neutral-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Sao lưu dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...backupForm}>
                <form onSubmit={backupForm.handleSubmit(onBackupSubmit)} className="space-y-6">
                  <FormField
                    control={backupForm.control}
                    name="filename"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên tệp tin sao lưu *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên tệp tin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={backupForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ghi chú</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập ghi chú cho bản sao lưu này" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      <strong>Lưu ý:</strong> Việc sao lưu dữ liệu sẽ tạo một bản sao của tất cả dữ liệu hệ thống hiện tại. 
                      Bạn có thể sử dụng bản sao lưu này để khôi phục dữ liệu khi cần thiết.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isBackingUp}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tạo bản sao lưu
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "restore" && (
        <div className="relative">
          {isRestoring && <LoadingOverlay />}
          
          <Card className="border border-neutral-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Khôi phục dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...restoreForm}>
                <form onSubmit={restoreForm.handleSubmit(onRestoreSubmit)} className="space-y-6">
                  <FormField
                    control={restoreForm.control}
                    name="filename"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên tệp tin khôi phục *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên tệp tin khôi phục" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={restoreForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ghi chú</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập ghi chú cho việc khôi phục này" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">
                      <strong>Cảnh báo:</strong> Việc khôi phục dữ liệu sẽ xóa tất cả dữ liệu hiện tại và thay thế bằng dữ liệu từ bản sao lưu. 
                      Hành động này không thể hoàn tác.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isRestoring}
                      className="flex items-center bg-red-600 hover:bg-red-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Khôi phục dữ liệu
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <Card className="border border-neutral-300">
          <CardHeader>
            <CardTitle>Lịch sử sao lưu và khôi phục</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSection />
            ) : (
              <DataTable
                columns={columns}
                data={backupLogs || []}
                searchPlaceholder="Tìm kiếm theo tên tệp tin hoặc ghi chú..."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
