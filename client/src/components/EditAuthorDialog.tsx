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

interface EditAuthorDialogProps {
  authorId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WRITING_STYLES = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "conversational", label: "Conversational" },
  { value: "academic", label: "Academic" },
  { value: "journalistic", label: "Journalistic" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "neutral", label: "Neutral" },
  { value: "humorous", label: "Humorous" },
];

export function EditAuthorDialog({
  authorId,
  open,
  onOpenChange,
  onSuccess,
}: EditAuthorDialogProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [writingStyle, setWritingStyle] = useState("conversational");
  const [tone, setTone] = useState("friendly");
  const [personality, setPersonality] = useState("");

  const { data: author, isLoading } = trpc.authors.getById.useQuery(
    { id: authorId },
    { enabled: open && authorId > 0 }
  );

  useEffect(() => {
    if (author) {
      setName(author.name);
      setBio(author.bio || "");
      setWritingStyle(author.writingStyle);
      setTone(author.tone);
      setPersonality(author.personality || "");
    }
  }, [author]);

  const updateMutation = trpc.authors.update.useMutation({
    onSuccess: () => {
      toast.success("Author updated");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to update author: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Author name is required");
      return;
    }
    updateMutation.mutate({
      id: authorId,
      name: name.trim(),
      bio: bio.trim() || undefined,
      writingStyle,
      tone,
      personality: personality.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <p>Loading...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Author</DialogTitle>
          <DialogDescription>
            Update the author's writing style and personality
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Author Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sarah Chen, Tech Analyst"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description of the author..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="writingStyle">Writing Style *</Label>
                <Select value={writingStyle} onValueChange={setWritingStyle}>
                  <SelectTrigger id="writingStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone *</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">AI Personality (Optional)</Label>
              <Textarea
                id="personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Detailed personality traits for AI generation"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
