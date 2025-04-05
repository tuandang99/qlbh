import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema, Product, Category } from "@shared/schema";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LoadingOverlay } from "@/components/ui/loading";

// Extend the product schema with client-side validation
const formSchema = insertProductSchema.extend({
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
  sku: z.string().min(2, "Mã SKU phải có ít nhất 2 ký tự"),
  costPrice: z.coerce.number().min(0, "Giá nhập không được âm"),
  sellingPrice: z.coerce.number().min(0, "Giá bán không được âm"),
  stockQuantity: z.coerce.number().min(0, "Số lượng tồn không được âm"),
  alertThreshold: z.coerce.number().min(0, "Ngưỡng cảnh báo không được âm").optional(),
});

type ProductFormProps = {
  product?: Product;
  categories: Category[];
  isEdit?: boolean;
};

export function ProductForm({ product, categories, isEdit = false }: ProductFormProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();

  // Initialize form with default values or existing product data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      barcode: product?.barcode || "",
      description: product?.description || "",
      categoryId: product?.categoryId || undefined,
      costPrice: product?.costPrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      stockQuantity: product?.stockQuantity || 0,
      alertThreshold: product?.alertThreshold || 5,
    },
  });

  // Create or update product mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (isEdit && product) {
        return apiRequest("PUT", `/api/products/${product.id}`, data);
      } else {
        return apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch products
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: isEdit ? "Sản phẩm đã được cập nhật" : "Sản phẩm đã được tạo",
        description: isEdit 
          ? `Sản phẩm "${form.getValues("name")}" đã được cập nhật thành công.`
          : `Sản phẩm "${form.getValues("name")}" đã được tạo thành công.`,
        variant: "success",
      });
      navigate("/products");
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
                  <h3 className="text-lg font-medium">Thông tin sản phẩm</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên sản phẩm *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên sản phẩm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã SKU *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập mã SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã vạch</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập mã vạch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danh mục</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập mô tả sản phẩm" 
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
                  <h3 className="text-lg font-medium">Thông tin giá & kho</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá nhập *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá bán *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lượng tồn *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="alertThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngưỡng cảnh báo</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/products")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Cập nhật" : "Tạo sản phẩm"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
