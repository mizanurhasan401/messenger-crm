"use client";

import { useQuery } from "@tanstack/react-query";
import type { Paginated } from "@messenger/shared";
import {
  Badge,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => apiClient.get<Paginated<AuditLog>>("/audit-logs"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Badge variant="outline">{l.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {l.entityType}
                    {l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell>{l.actorUserId.slice(0, 8)}</TableCell>
                  <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No audit entries.
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
