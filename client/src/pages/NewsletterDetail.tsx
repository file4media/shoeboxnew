import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, FileText, Plus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function NewsletterDetail() {
  const [, params] = useRoute("/newsletters/:id");
  const newsletterId = params?.id ? parseInt(params.id) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");

  const { data: newsletter, isLoading: newsletterLoading } = trpc.newsletters.getById.useQuery(
    { id: newsletterId },
    { enabled: !!user && newsletterId > 0 }
  );

  const { data: editions, isLoading: editionsLoading, refetch } = trpc.editions.list.useQuery(
    { newsletterId },
    { enabled: !!user && newsletterId > 0 }
  );

  const createMutation = trpc.editions.create.useMutation({
    onSuccess: (edition) => {
      toast.success("Edition created successfully");
      setIsCreateOpen(false);
      setSubject("");
      refetch();
      setLocation(`/newsletters/${newsletterId}/editions/${edition.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading || newsletterLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!newsletter) {
    return <div>Newsletter not found</div>;
  }

  const handleCreate = () => {
    if (!subject) {
      toast.error("Please enter a subject");
      return;
    }
    createMutation.mutate({
      newsletterId,
      subject,
      contentMarkdown: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      scheduled: "default",
      sending: "default",
      sent: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => setLocation("/newsletters")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletters
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{newsletter.name}</h1>
          <p className="text-muted-foreground">{newsletter.description || "No description"}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setLocation(`/newsletters/${newsletterId}/articles`)}>
              Article Library
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/newsletters/${newsletterId}/subscribers`)}>
              Manage Subscribers
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/newsletters/${newsletterId}/analytics`)}>
              View Analytics
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Editions</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Edition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Edition</DialogTitle>
                <DialogDescription>
                  Create a new newsletter edition. You can add content and send it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Your newsletter subject"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Edit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {editionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : editions && editions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editions.map((edition) => (
              <Card key={edition.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/newsletters/${newsletterId}/editions/${edition.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex-1">{edition.subject}</CardTitle>
                    {getStatusBadge(edition.status)}
                  </div>
                  <CardDescription>
                    {edition.createdAt ? new Date(edition.createdAt).toLocaleDateString() : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {edition.status === "sent" && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipients:</span>
                        <span className="font-medium">{edition.totalRecipients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opens:</span>
                        <span className="font-medium">{edition.uniqueOpens}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No editions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first edition to start crafting content for your subscribers.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Edition
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
