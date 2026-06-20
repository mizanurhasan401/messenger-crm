"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

interface Summary {
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  conversionRate: number;
}

const STAT_LABELS: Array<{ key: keyof Summary; label: string; money?: boolean; pct?: boolean }> = [
  { key: "totalCustomers", label: "Customers" },
  { key: "totalOrders", label: "Orders" },
  { key: "pendingOrders", label: "Pending" },
  { key: "deliveredOrders", label: "Delivered" },
  { key: "revenue", label: "Revenue", money: true },
  { key: "conversionRate", label: "Conversion", pct: true },
];

export default function DashboardHome() {
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => apiClient.get<Summary>("/analytics/summary"),
  });
  const revenue = useQuery({
    queryKey: ["analytics", "monthly-revenue"],
    queryFn: () => apiClient.get<Array<{ month: string; revenue: number }>>("/analytics/monthly-revenue"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {STAT_LABELS.map(({ key, label, money, pct }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.data
                  ? money
                    ? `৳${summary.data[key].toLocaleString()}`
                    : pct
                      ? `${summary.data[key]}%`
                      : summary.data[key]
                  : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {revenue.data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
