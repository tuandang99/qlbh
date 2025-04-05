import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { LoadingSpinner } from "@/components/ui/loading";

type SalesChartProps = {
  title?: string;
  data: Array<{
    day: string;
    amount: number;
  }>;
  isLoading?: boolean;
};

export function SalesChart({ 
  title = "Doanh thu 7 ngày qua", 
  data,
  isLoading = false 
}: SalesChartProps) {
  const [chartType, setChartType] = React.useState("revenue");

  // Format the currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {formatCurrency(payload[0].value)}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-neutral-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Select
            value={chartType}
            onValueChange={setChartType}
          >
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Chọn chỉ số" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Doanh thu</SelectItem>
              <SelectItem value="profit">Lợi nhuận</SelectItem>
              <SelectItem value="orders">Đơn hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-64 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner className="text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  fill="rgba(59, 130, 246, 0.2)"
                  activeBar={{ fill: "rgba(30, 64, 175, 1)" }}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
