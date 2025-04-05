import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading";

// Import icons
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  Users,
  LineChart,
} from "lucide-react";

type StatVariant = "revenue" | "orders" | "customers" | "profit";

const statIcons = {
  revenue: Wallet,
  orders: ShoppingBag,
  customers: Users,
  profit: LineChart,
};

const statColors = {
  revenue: "bg-primary-light/10 text-primary",
  orders: "bg-indigo-100 text-indigo-600",
  customers: "bg-amber-100 text-amber-600",
  profit: "bg-emerald-100 text-emerald-600",
};

type StatCardProps = {
  title: string;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  variant: StatVariant;
  isLoading?: boolean;
};

export function StatCard({
  title,
  value,
  trend,
  variant,
  isLoading = false,
}: StatCardProps) {
  const Icon = statIcons[variant];
  const colorClass = statColors[variant];

  return (
    <Card className="border border-neutral-300">
      <CardContent className="p-5">
        <div className="flex justify-between mb-3">
          <div className="text-neutral-500">{title}</div>
          <div className={cn("p-2 rounded-md", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="flex items-center h-8">
              <LoadingSpinner size="small" className="text-primary" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-semibold">{value}</div>
              {trend && (
                <div
                  className={cn(
                    "flex items-center text-sm mt-1",
                    trend.isPositive ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span>{trend.value}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
