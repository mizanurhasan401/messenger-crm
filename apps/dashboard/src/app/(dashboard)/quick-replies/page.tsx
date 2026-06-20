"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, Input } from "@messenger/ui";
import { apiClient } from "@/lib/api-client";

interface QuickReply {
  id: string;
  title: string;
  shortcut: string;
  content: string;
}

export default function QuickRepliesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => apiClient.get<QuickReply[]>("/quick-replies"),
  });
  const create = useMutation({
    mutationFn: (body: { title: string; shortcut: string; content: string }) =>
      apiClient.post("/quick-replies", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick-replies"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/quick-replies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick-replies"] }),
  });

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      title: String(form.get("title")),
      shortcut: String(form.get("shortcut")),
      content: String(form.get("content")),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quick Replies</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Title" required />
            <Input name="shortcut" placeholder="/price" required />
            <Input name="content" placeholder="Reply text" required className="md:col-span-2" />
            <Button type="submit" disabled={create.isPending}>
              Add quick reply
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {data?.map((qr) => (
          <Card key={qr.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div>
                <p className="font-medium">
                  {qr.title} <span className="text-muted-foreground">{qr.shortcut}</span>
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{qr.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(qr.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
