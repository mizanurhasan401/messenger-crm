"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { apiClient } from "@/lib/api-client";

interface Member {
  id: string;
  role: string;
  status: string;
  user: { name: string | null; email: string };
}

export default function TeamPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["team"],
    queryFn: () => apiClient.get<Member[]>("/team"),
  });
  const invite = useMutation({
    mutationFn: (body: { email: string; role: string }) => apiClient.post("/team/invite", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });

  function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    invite.mutate({ email: String(form.get("email")), role: String(form.get("role")) });
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Team</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onInvite} className="flex flex-wrap items-end gap-3">
            <Input name="email" type="email" placeholder="teammate@email.com" required />
            <select name="role" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="MANAGER">Manager</option>
              <option value="AGENT">Agent</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button type="submit" disabled={invite.isPending}>
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.user.name ?? "—"}</TableCell>
                  <TableCell>{m.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.role}</Badge>
                  </TableCell>
                  <TableCell>{m.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
