import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CreateAuthorDialog } from "@/components/CreateAuthorDialog";
import { EditAuthorDialog } from "@/components/EditAuthorDialog";

export default function Authors() {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(newsletterId || "0", 10);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<number | null>(null);

  const { data: authors, isLoading, refetch } = trpc.authors.list.useQuery(
    { newsletterId: id },
    { enabled: id > 0 }
  );

  const deleteMutation = trpc.authors.delete.useMutation({
    onSuccess: () => {
      toast.success("Author deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete author: ${error.message}`);
    },
  });

  const handleDelete = (authorId: number, authorName: string) => {
    if (confirm(`Delete author "${authorName}"? Articles will not be deleted.`)) {
      deleteMutation.mutate({ id: authorId });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Loading authors...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/newsletters/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Newsletter
      </Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Authors</h1>
          <p className="text-muted-foreground mt-1">
            Manage writing personas with distinct AI styles
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Author
        </Button>
      </div>

      {authors && authors.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No authors yet</h3>
            <p className="text-muted-foreground mb-4">
              Create author personas with unique writing styles for AI-generated content
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Author
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {authors?.map((author) => (
          <Card key={author.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{author.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {author.writingStyle} • {author.tone}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingAuthor(author.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(author.id, author.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {author.bio && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {author.bio}
                </p>
                {author.personality && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>AI Personality:</strong> {author.personality}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <CreateAuthorDialog
        newsletterId={id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      {editingAuthor && (
        <EditAuthorDialog
          authorId={editingAuthor}
          open={true}
          onOpenChange={(open) => !open && setEditingAuthor(null)}
          onSuccess={() => {
            setEditingAuthor(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
