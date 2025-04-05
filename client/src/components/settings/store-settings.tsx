import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStoreSettingsSchema, StoreSettings } from "@shared/schema";

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
import { LoadingOverlay, LoadingSection } from "@/components/ui/loading";

// Extend the settings schema with client-side validation
const formSchema = insertStoreSettingsSchema.extend({
  storeName: z.string().min(2, "Tên cửa hàng phải có ít nhất 2 ký tự"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0, "Thuế không được âm").max(100, "Thuế không được quá 100%").optional(),
  currencySymbol: z.string().default("đ"),
  openingHours: z.string().optional(),
});

// Export component
export default function StoreSettingsComponent() {
  // Fetch current settings
  const { data: settings, isLoading } = useQuery<StoreSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/settings", { headers });
      if (!response.ok) throw new Error("Không thể tải cài đặt hệ thống");
      return response.json();
    }
  });

  // Initialize form with default values or existing settings
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: settings?.storeName || "",
      address: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      taxRate: settings?.taxRate || 0,
      currencySymbol: settings?.currencySymbol || "đ",
      openingHours: settings?.openingHours || "",
    },
  });

  // Set form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset({
        storeName: settings.storeName,
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        taxRate: settings.taxRate || 0,
        currencySymbol: settings.currencySymbol || "đ",
        openingHours: settings.openingHours || "",
      });
    }
  }, [settings, form]);

  // Update settings mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: async () => {
      toast({
        title: "Cài đặt đã được lưu",
        description: "Thông tin cửa hàng đã được cập nhật thành công.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi lưu cài đặt.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutate(data);
  };

  if (isLoading) {
    return <LoadingSection />;
  }

  return (
    <div className="relative">
      {isPending && <LoadingOverlay />}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border border-neutral-300">
            <CardHeader>
              <CardTitle>Thông tin cửa hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên cửa hàng *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên cửa hàng" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập địa chỉ cửa hàng" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập số điện thoại" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="openingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giờ làm việc</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: 8:00 - 22:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thuế suất (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currencySymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ký hiệu tiền tệ</FormLabel>
                          <FormControl>
                            <Input placeholder="Ví dụ: đ, ₫, VND" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  Lưu thay đổi
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
