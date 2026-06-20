"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

export default function AnalyticsPage() {
  const growth = useQuery({
    queryKey: ["analytics", "customer-growth"],
    queryFn: () =>
      apiClient.get<Array<{ month: string; count: number }>>("/analytics/customer-growth"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customer Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {growth.data && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
