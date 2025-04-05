import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCustomerSchema, Customer } from "@shared/schema";

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

// Extend the customer schema with client-side validation
const formSchema = insertCustomerSchema.extend({
  name: z.string().min(2, "Tên khách hàng phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
  loyaltyPoints: z.coerce.number().min(0, "Điểm tích lũy không được âm").optional(),
});

type CustomerFormProps = {
  customer?: Customer;
  isEdit?: boolean;
};

export function CustomerForm({ customer, isEdit = false }: CustomerFormProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();

  // Initialize form with default values or existing customer data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      loyaltyPoints: customer?.loyaltyPoints || 0,
    },
  });

  // Create or update customer mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (isEdit && customer) {
        return apiRequest("PUT", `/api/customers/${customer.id}`, data);
      } else {
        return apiRequest("POST", "/api/customers", data);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch customers
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: isEdit ? "Khách hàng đã được cập nhật" : "Khách hàng đã được tạo",
        description: isEdit 
          ? `Khách hàng "${form.getValues("name")}" đã được cập nhật thành công.`
          : `Khách hàng "${form.getValues("name")}" đã được tạo thành công.`,
        variant: "success",
      });
      navigate("/customers");
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
                  <h3 className="text-lg font-medium">Thông tin khách hàng</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên khách hàng *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên khách hàng" {...field} />
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
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập địa chỉ khách hàng" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Thông tin tích lũy</h3>
                  
                  <FormField
                    control={form.control}
                    name="loyaltyPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Điểm tích lũy</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isEdit && (
                    <div className="p-4 bg-gray-50 rounded-md border">
                      <h4 className="font-medium mb-2">Thông tin bổ sung</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        • Khách hàng tích lũy 1 điểm cho mỗi 10,000đ chi tiêu
                      </p>
                      <p className="text-sm text-gray-600">
                        • Có thể đổi điểm để được giảm giá khi mua hàng
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/customers")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Cập nhật" : "Tạo khách hàng"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
