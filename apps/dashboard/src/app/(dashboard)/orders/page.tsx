"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus, Paginated } from "@messenger/shared";
import {
  Badge,
  Card,
  CardContent,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string;
  currency: string;
  customer: { name: string };
  createdAt: string;
}

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  RETURNED: "destructive",
  CANCELLED: "destructive",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const { data } = useQuery({
    queryKey: ["orders", { search }],
    queryFn: () =>
      apiClient.get<Paginated<OrderRow>>(`/orders?search=${encodeURIComponent(search)}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <Input
        placeholder="Search by order number or customer…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {o.currency} {Number(o.total).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
