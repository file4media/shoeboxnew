import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Loader2, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Subscribers() {
  const [, params] = useRoute("/newsletters/:id/subscribers");
  const newsletterId = params?.id ? parseInt(params.id) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const { data: subscribers, isLoading, refetch } = trpc.subscribers.getByNewsletter.useQuery(
    { newsletterId },
    { enabled: !!user && newsletterId > 0 }
  );

  const addMutation = trpc.subscribers.add.useMutation({
    onSuccess: () => {
      toast.success("Subscriber added successfully");
      setIsAddOpen(false);
      setEmail("");
      setName("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) {
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

  const handleAdd = () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    addMutation.mutate({
      newsletterId,
      email,
      name,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => setLocation(`/newsletters/${newsletterId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletter
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Subscribers</h1>
            <p className="text-muted-foreground">Manage your newsletter subscribers</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
                <DialogDescription>
                  Add a new subscriber to this newsletter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="subscriber@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscribers && subscribers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>{subscriber.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscriber.subscriptionStatus === "subscribed" ? "default" : "secondary"}>
                          {subscriber.subscriptionStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscribers yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first subscriber to start building your audience.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscriber
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
