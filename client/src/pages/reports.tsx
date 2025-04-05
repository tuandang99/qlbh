import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, FileDown } from "lucide-react";

// Sample data - in a real app, this would come from the API
const salesData = [
  { name: "Tháng 1", revenue: 4000000, profit: 1200000 },
  { name: "Tháng 2", revenue: 5000000, profit: 1500000 },
  { name: "Tháng 3", revenue: 6000000, profit: 1800000 },
  { name: "Tháng 4", revenue: 5500000, profit: 1650000 },
  { name: "Tháng 5", revenue: 7000000, profit: 2100000 },
  { name: "Tháng 6", revenue: 8000000, profit: 2400000 },
  { name: "Tháng 7", revenue: 8550000, profit: 2550000 },
];

const productCategorySales = [
  { name: "Quần áo nam", value: 4000000 },
  { name: "Quần áo nữ", value: 3000000 },
  { name: "Giày dép", value: 2000000 },
  { name: "Phụ kiện", value: 1500000 },
];

const topProducts = [
  { name: "Áo thun nam size L", revenue: 1200000, quantity: 32 },
  { name: "Quần jean nữ size 28", revenue: 1050000, quantity: 24 },
  { name: "Giày thể thao nam size 42", revenue: 980000, quantity: 18 },
  { name: "Túi xách nữ da cao cấp", revenue: 850000, quantity: 10 },
  { name: "Áo sơ mi nam size M", revenue: 750000, quantity: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [reportTab, setReportTab] = useState("sales");
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout 
      title="Báo cáo thống kê"
      requireAuth={true}
      allowedRoles={["admin", "manager"]}
    >
      <div className="space-y-6">
        <Card className="border border-neutral-300">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>Báo cáo</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              <Button variant="outline" className="flex items-center">
                <FileDown className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" value={reportTab} onValueChange={setReportTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="sales">Doanh thu</TabsTrigger>
                <TabsTrigger value="products">Sản phẩm</TabsTrigger>
                <TabsTrigger value="customers">Khách hàng</TabsTrigger>
                <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-neutral-300">
                    <CardContent className="p-4">
                      <div className="text-neutral-500 mb-1">Tổng doanh thu</div>
                      <div className="text-2xl font-semibold">
                        {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-neutral-300">
                    <CardContent className="p-4">
                      <div className="text-neutral-500 mb-1">Lợi nhuận</div>
                      <div className="text-2xl font-semibold">
                        {formatCurrency(salesData.reduce((sum, item) => sum + item.profit, 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-neutral-300">
                    <CardContent className="p-4">
                      <div className="text-neutral-500 mb-1">Tỷ suất lợi nhuận</div>
                      <div className="text-2xl font-semibold">
                        {Math.round((salesData.reduce((sum, item) => sum + item.profit, 0) / 
                          salesData.reduce((sum, item) => sum + item.revenue, 0)) * 100)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="border border-neutral-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Doanh thu theo thời gian</CardTitle>
                      <Select defaultValue="revenue">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Chọn chỉ số" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Doanh thu</SelectItem>
                          <SelectItem value="profit">Lợi nhuận</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={salesData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            tickFormatter={(value) =>
                              new Intl.NumberFormat("vi-VN", {
                                notation: "compact",
                                compactDisplay: "short",
                              }).format(value)
                            }
                          />
                          <Tooltip
                            formatter={(value) => [
                              formatCurrency(value as number),
                              "Doanh thu",
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#22c55e"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="products" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-neutral-300">
                    <CardHeader>
                      <CardTitle>Doanh thu theo danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              dataKey="value"
                              data={productCategorySales}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {productCategorySales.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [formatCurrency(value as number), "Doanh thu"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-neutral-300">
                    <CardHeader>
                      <CardTitle>Top sản phẩm bán chạy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProducts}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              tickFormatter={(value) =>
                                new Intl.NumberFormat("vi-VN", {
                                  notation: "compact",
                                  compactDisplay: "short",
                                }).format(value)
                              }
                            />
                            <YAxis type="category" dataKey="name" width={120} />
                            <Tooltip formatter={(value) => [formatCurrency(value as number), "Doanh thu"]} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="customers">
                <div className="text-center py-10">
                  <p>Báo cáo khách hàng đang được phát triển</p>
                </div>
              </TabsContent>
              
              <TabsContent value="inventory">
                <div className="text-center py-10">
                  <p>Báo cáo tồn kho đang được phát triển</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
