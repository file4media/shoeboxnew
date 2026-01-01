import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Sparkles, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { CreateArticleDialog } from "@/components/CreateArticleDialog";
import { GenerateArticleDialog } from "@/components/GenerateArticleDialog";
import { EditArticleDialog } from "@/components/EditArticleDialog";

export default function Articles() {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<number | null>(null);

  const { data: newsletter } = trpc.newsletters.getById.useQuery(
    { id: Number(newsletterId) },
    { enabled: !!newsletterId }
  );

  const { data: articles = [], refetch } = trpc.articles.list.useQuery(
    { newsletterId: Number(newsletterId) },
    { enabled: !!newsletterId }
  );

  const deleteArticle = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success("Article deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.category && article.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle.mutate({ id });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Article Library</h1>
            <p className="text-muted-foreground mt-1">
              {newsletter?.name || "Loading..."} - Create and manage reusable articles
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "No articles match your search"
                : "Create your first article to get started"}
            </p>
            {!searchQuery && (
              <div className="flex gap-2">
                <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    {article.category && (
                      <Badge variant="secondary" className="mt-2">
                        {article.category}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      article.status === "published"
                        ? "default"
                        : article.status === "archived"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {article.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 mb-4">
                  {article.excerpt || article.content.substring(0, 150) + "..."}
                </CardDescription>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingArticle(article.id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateArticleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newsletterId={Number(newsletterId)}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      <GenerateArticleDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        newsletterId={Number(newsletterId)}
        onSuccess={() => {
          refetch();
          setShowGenerateDialog(false);
        }}
      />

      {editingArticle && (
        <EditArticleDialog
          open={!!editingArticle}
          onOpenChange={(open) => !open && setEditingArticle(null)}
          articleId={editingArticle}
          onSuccess={() => {
            refetch();
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
}
