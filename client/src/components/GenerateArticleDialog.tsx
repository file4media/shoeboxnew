import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GenerateArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsletterId: number;
  onSuccess: () => void;
}

export function GenerateArticleDialog({
  open,
  onOpenChange,
  newsletterId,
  onSuccess,
}: GenerateArticleDialogProps) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "humorous" | "serious">("professional");
  const [authorId, setAuthorId] = useState<number | undefined>(undefined);
  const [allowEmojis, setAllowEmojis] = useState(false);

  const { data: authors = [] } = trpc.authors.list.useQuery(
    { newsletterId },
    { enabled: open && newsletterId > 0 }
  );

  const generateArticle = trpc.articles.generateWithAI.useMutation({
    onSuccess: () => {
      toast.success("Article generated successfully!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate article");
    },
  });

  const resetForm = () => {
    setTopic("");
    setCategory("");
    setTone("professional");
    setAuthorId(undefined);
    setAllowEmojis(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    generateArticle.mutate({
      newsletterId,
      topic: topic.trim(),
      category: category.trim() || undefined,
      tone,
      authorId,
      allowEmojis,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Article with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you want to write about and let AI create the article for you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The future of AI in healthcare"
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
            <Label htmlFor="author">Author (Optional)</Label>
            <Select value={authorId?.toString() || "none"} onValueChange={(v) => setAuthorId(v === "none" ? undefined : parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No author - use tone below</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id.toString()}>
                    {author.name} ({author.writingStyle}, {author.tone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {authorId ? "AI will use this author's writing style" : "AI will use the tone selected below"}
            </p>
          </div>

          <div>
            <Label htmlFor="tone">Tone {authorId && "(overridden by author style)"}</Label>
            <Select value={tone} onValueChange={(v: any) => setTone(v)} disabled={!!authorId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowEmojis"
              checked={allowEmojis}
              onCheckedChange={(checked) => setAllowEmojis(checked as boolean)}
            />
            <Label htmlFor="allowEmojis" className="text-sm font-normal cursor-pointer">
              Allow emojis in generated content
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateArticle.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generateArticle.isPending}>
              {generateArticle.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
