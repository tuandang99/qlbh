import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/lib/navigation";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertOrderSchema, insertOrderItemSchema, Product, Customer } from "@shared/schema";

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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LoadingSection, LoadingOverlay } from "@/components/ui/loading";
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart,
  UserPlus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Extended schema for order form
const formSchema = insertOrderSchema.extend({
  customerId: z.number().optional(),
  paymentMethod: z.string().default("cash"),
  notes: z.string().optional(),
});

// Interface for order items with additional fields for UI
interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product; // For display purposes
}

export function OrderForm() {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Calculate order totals
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const [discount, setDiscount] = useState(0);
  const finalAmount = totalAmount - discount;

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: undefined,
      status: "pending",
      totalAmount: 0,
      discount: 0,
      finalAmount: 0,
      paymentMethod: "cash",
      notes: "",
    },
  });

  // Update form values when totals change
  useEffect(() => {
    form.setValue("totalAmount", totalAmount);
    form.setValue("discount", discount);
    form.setValue("finalAmount", finalAmount);
  }, [totalAmount, discount, finalAmount, form]);

  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/customers", { headers });
      if (!response.ok) throw new Error("Không thể tải danh sách khách hàng");
      return response.json();
    }
  });

  // Fetch products for search
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/products", { headers });
      if (!response.ok) throw new Error("Không thể tải danh sách sản phẩm");
      return response.json();
    }
  });

  // Order creation mutation
  const { mutate: createOrder, isPending: isCreatingOrder } = useMutation({
    mutationFn: async (data: {
      order: z.infer<typeof formSchema>;
      items: OrderItem[];
    }) => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      return apiRequest("POST", "/api/orders", data, headers);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Đơn hàng đã được tạo",
        description: "Đơn hàng mới đã được tạo thành công.",
        variant: "default",
      });
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo đơn hàng.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (orderItems.length === 0) {
      toast({
        title: "Không thể tạo đơn hàng",
        description: "Vui lòng thêm ít nhất một sản phẩm vào đơn hàng.",
        variant: "destructive",
      });
      return;
    }

    // Prepare order items without the product objects
    const items = orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }));

    createOrder({ order: data, items });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Add product to order
  const addProductToOrder = () => {
    if (!selectedProduct) return;
    
    // Check if product already exists in order
    const existingItemIndex = orderItems.findIndex(
      item => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      const item = updatedItems[existingItemIndex];
      item.quantity += productQuantity;
      item.subtotal = item.quantity * item.unitPrice;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        quantity: productQuantity,
        unitPrice: selectedProduct.sellingPrice,
        subtotal: productQuantity * selectedProduct.sellingPrice,
        product: selectedProduct,
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setProductQuantity(1);
    setSearchQuery("");
    setIsSearchDialogOpen(false);
  };

  // Remove product from order
  const removeProductFromOrder = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = quantity * updatedItems[index].unitPrice;
    setOrderItems(updatedItems);
  };

  // Filter products based on search query
  const filteredProducts = searchQuery
    ? products?.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="relative">
      {isCreatingOrder && <LoadingOverlay />}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border border-neutral-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Thông tin đơn hàng</h3>
                    <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Thêm sản phẩm
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Tìm sản phẩm</DialogTitle>
                        </DialogHeader>
                        
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-grow">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                placeholder="Tìm theo tên sản phẩm, mã SKU hoặc mã vạch"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          
                          {isLoadingProducts ? (
                            <LoadingSection />
                          ) : (
                            <>
                              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Sản phẩm</TableHead>
                                      <TableHead>Giá</TableHead>
                                      <TableHead>Tồn kho</TableHead>
                                      <TableHead></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredProducts && filteredProducts.length > 0 ? (
                                      filteredProducts.map((product) => (
                                        <TableRow key={product.id} onClick={() => setSelectedProduct(product)}
                                          className={`cursor-pointer ${
                                            selectedProduct?.id === product.id ? "bg-primary/10" : ""
                                          }`}
                                        >
                                          <TableCell>
                                            <div>
                                              <div className="font-medium">{product.name}</div>
                                              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                            </div>
                                          </TableCell>
                                          <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                                          <TableCell>
                                            <Badge variant={product.stockQuantity > 0 ? "success" : "danger"}>
                                              {product.stockQuantity}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(product);
                                              }}
                                            >
                                              Chọn
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : searchQuery ? (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">
                                          Không tìm thấy sản phẩm phù hợp
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">
                                          Nhập từ khóa để tìm kiếm sản phẩm
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              {selectedProduct && (
                                <div className="border p-4 rounded-md bg-gray-50">
                                  <div className="flex justify-between mb-2">
                                    <div className="font-medium">{selectedProduct.name}</div>
                                    <div>{formatCurrency(selectedProduct.sellingPrice)}</div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                                      >
                                        -
                                      </Button>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={productQuantity}
                                        onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                                        className="w-16 text-center"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setProductQuantity(productQuantity + 1)}
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <Button type="button" onClick={addProductToOrder}>
                                      Thêm vào đơn hàng
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {orderItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-md">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">Chưa có sản phẩm nào trong đơn hàng</p>
                      <Button variant="outline" className="mt-4" onClick={() => setIsSearchDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm sản phẩm
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Đơn giá</TableHead>
                            <TableHead>Số lượng</TableHead>
                            <TableHead>Thành tiền</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.product?.name}</div>
                                  <div className="text-xs text-gray-500">SKU: {item.product?.sku}</div>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                    className="w-16 text-center"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProductFromOrder(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border border-neutral-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Ghi chú đơn hàng</h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập ghi chú cho đơn hàng" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="border border-neutral-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Thông tin thanh toán</h3>
                  
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Khách hàng</FormLabel>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn khách hàng" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Phương thức thanh toán</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phương thức" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Tiền mặt</SelectItem>
                            <SelectItem value="card">Thẻ</SelectItem>
                            <SelectItem value="transfer">Chuyển khoản</SelectItem>
                            <SelectItem value="momo">Ví MoMo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Trạng thái đơn hàng</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Đang xử lý</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tổng tiền hàng:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giảm giá:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                          className="w-24 text-right"
                        />
                        <span>đ</span>
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span>Tổng thanh toán:</span>
                      <span className="text-primary">{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex flex-col space-y-4">
                <Button type="submit" size="lg" disabled={isCreatingOrder || orderItems.length === 0}>
                  Tạo đơn hàng
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate("/orders")}>
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
