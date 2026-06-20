"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Paginated } from "@messenger/shared";
import {
  Badge,
  Button,
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

interface Followup {
  id: string;
  dueAt: string;
  status: string;
  note: string | null;
  customer: { name: string };
}

export default function FollowupsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["followups", "upcoming"],
    queryFn: () => apiClient.get<Paginated<Followup>>("/followups?scope=upcoming"),
  });
  const complete = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/followups/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["followups"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Upcoming Follow-ups</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.customer.name}</TableCell>
                  <TableCell>{new Date(f.dueAt).toLocaleString()}</TableCell>
                  <TableCell>{f.note ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{f.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => complete.mutate(f.id)}>
                      Complete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No upcoming follow-ups.
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
