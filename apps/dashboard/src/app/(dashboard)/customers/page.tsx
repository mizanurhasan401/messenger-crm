"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Paginated } from "@messenger/shared";
import {
  Badge,
  Button,
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
import { apiClient, getActiveOrgId } from "@/lib/api-client";

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  fbName: string | null;
  tags: Array<{ id: string; label: string }>;
  _count: { orders: number };
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data } = useQuery({
    queryKey: ["customers", { search, page }],
    queryFn: () =>
      apiClient.get<Paginated<CustomerRow>>(
        `/customers?search=${encodeURIComponent(search)}&page=${page}`,
      ),
  });

  const create = useMutation({
    mutationFn: (body: { name: string; phone?: string }) => apiClient.post("/customers", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setCreating(false);
    },
  });

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({ name: String(form.get("name")), phone: String(form.get("phone")) || undefined });
  }

  function exportCsv() {
    const orgId = getActiveOrgId();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/customers/export`;
    // Open in a new tab; cookie auth + org header via fetch download.
    fetch(url, { credentials: "include", headers: { "x-organization-id": orgId ?? "" } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "customers.csv";
        a.click();
      });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button onClick={() => setCreating((v) => !v)}>New customer</Button>
        </div>
      </div>

      {creating && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-sm">Name</label>
                <Input name="name" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Phone</label>
                <Input name="phone" />
              </div>
              <Button type="submit" disabled={create.isPending}>
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Search by name, phone, FB name…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell>{c.fbName ?? "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    {c.tags.map((t) => (
                      <Badge key={t.id} variant="secondary">
                        {t.label}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{c._count.orders}</TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No customers yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
