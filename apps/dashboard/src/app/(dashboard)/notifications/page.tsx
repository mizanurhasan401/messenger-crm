"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/notifications"),
  });
  const markAll = useMutation({
    mutationFn: () => apiClient.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
          Mark all read
        </Button>
      </div>
      <div className="space-y-2">
        {data?.map((n) => (
          <Card key={n.id} className={n.readAt ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground">No notifications.</p>}
      </div>
    </div>
  );
}
