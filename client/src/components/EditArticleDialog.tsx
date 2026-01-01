import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EditArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number;
  onSuccess: () => void;
}

export function EditArticleDialog({
  open,
  onOpenChange,
  articleId,
  onSuccess,
}: EditArticleDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [authorId, setAuthorId] = useState<number | undefined>(undefined);

  const { data: article, isLoading } = trpc.articles.getById.useQuery(
    { id: articleId },
    { enabled: !!articleId && open }
  );

  const { data: authors = [] } = trpc.authors.list.useQuery(
    { newsletterId: article?.newsletterId || 0 },
    { enabled: !!article && open }
  );

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setExcerpt(article.excerpt || "");
      setCategory(article.category || "");
      setImageUrl(article.imageUrl || "");
      setStatus(article.status as any);
      setAuthorId(article.authorId || undefined);
    }
  }, [article]);

  const updateArticle = trpc.articles.update.useMutation({
    onSuccess: () => {
      toast.success("Article updated");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    updateArticle.mutate({
      id: articleId,
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || undefined,
      category: category.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      status,
      authorId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
          <DialogDescription>
            Make changes to your article. Changes will be reflected wherever this article is used.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Tech, Business, Opinion"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary (optional)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="content">Content * (Markdown supported)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here..."
                rows={12}
                required
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="author">Author (Optional)</Label>
              <Select value={authorId?.toString() || "none"} onValueChange={(v) => setAuthorId(v === "none" ? undefined : parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an author" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No author</SelectItem>
                  {authors.map((author) => (
                    <SelectItem key={author.id} value={author.id.toString()}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateArticle.isPending}>
                {updateArticle.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
