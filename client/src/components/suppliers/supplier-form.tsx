import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSupplierSchema, Supplier } from "@shared/schema";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingOverlay } from "@/components/ui/loading";

// Extend the supplier schema with client-side validation
const formSchema = insertSupplierSchema.extend({
  name: z.string().min(2, "Tên nhà cung cấp phải có ít nhất 2 ký tự"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
});

type SupplierFormProps = {
  supplier?: Supplier;
  isEdit?: boolean;
};

export function SupplierForm({ supplier, isEdit = false }: SupplierFormProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();

  // Initialize form with default values or existing supplier data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier?.name || "",
      contactPerson: supplier?.contactPerson || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      address: supplier?.address || "",
    },
  });

  // Create or update supplier mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (isEdit && supplier) {
        return apiRequest("PUT", `/api/suppliers/${supplier.id}`, data);
      } else {
        return apiRequest("POST", "/api/suppliers", data);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch suppliers
      await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: isEdit ? "Nhà cung cấp đã được cập nhật" : "Nhà cung cấp đã được tạo",
        description: isEdit 
          ? `Nhà cung cấp "${form.getValues("name")}" đã được cập nhật thành công.`
          : `Nhà cung cấp "${form.getValues("name")}" đã được tạo thành công.`,
        variant: "success",
      });
      navigate("/suppliers");
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

  return (
    <div className="relative">
      {isPending && <LoadingOverlay />}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border border-neutral-300">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Thông tin nhà cung cấp</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên nhà cung cấp *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên nhà cung cấp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Người liên hệ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên người liên hệ" {...field} />
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
                  <h3 className="text-lg font-medium">Thông tin liên hệ</h3>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập địa chỉ nhà cung cấp" 
                            className="resize-none" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
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
              onClick={() => navigate("/suppliers")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Cập nhật" : "Tạo nhà cung cấp"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
