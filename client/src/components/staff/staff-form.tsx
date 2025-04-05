import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/navigation";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, User } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay } from "@/components/ui/loading";

// Extend the user schema with client-side validation
const formSchema = insertUserSchema.extend({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(isEdit => isEdit ? 0 : 6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự"
  }).optional().or(z.literal("")),
  fullName: z.string().min(2, "Tên nhân viên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  role: z.string(),
  active: z.boolean().default(true),
});

type StaffFormProps = {
  user?: User;
  isEdit?: boolean;
};

export function StaffForm({ user, isEdit = false }: StaffFormProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();

  // Initialize form with default values or existing user data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      password: "", // Empty for security reasons even when editing
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "staff",
      active: user?.active ?? true,
    },
    context: { isEdit },
  });

  // Create or update user mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // If editing and password is empty, remove it from the payload
      if (isEdit && !data.password) {
        const { password, ...rest } = data;
        return apiRequest("PUT", `/api/users/${user!.id}`, rest);
      } else {
        return isEdit 
          ? apiRequest("PUT", `/api/users/${user!.id}`, data)
          : apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch users
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: isEdit ? "Nhân viên đã được cập nhật" : "Nhân viên đã được tạo",
        description: isEdit 
          ? `Nhân viên "${form.getValues("fullName")}" đã được cập nhật thành công.`
          : `Nhân viên "${form.getValues("fullName")}" đã được tạo thành công.`,
        variant: "success",
      });
      navigate("/staff");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi xử lý yêu cầu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutate(data);
  };

  // Role options
  const roleOptions = [
    { value: "admin", label: "Quản trị viên" },
    { value: "manager", label: "Quản lý" },
    { value: "staff", label: "Nhân viên" },
    { value: "cashier", label: "Thu ngân" },
  ];

  return (
    <div className="relative">
      {isPending && <LoadingOverlay />}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border border-neutral-300">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Thông tin đăng nhập</h3>
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đăng nhập *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên đăng nhập" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEdit ? "Mật khẩu mới" : "Mật khẩu *"}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={isEdit ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                            {...field} 
                          />
                        </FormControl>
                        {isEdit && (
                          <FormDescription>
                            Để trống nếu không muốn thay đổi mật khẩu
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Trạng thái tài khoản</FormLabel>
                          <FormDescription>
                            {field.value ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập họ và tên" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Nhập email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vai trò *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/staff")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Cập nhật" : "Tạo tài khoản"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
