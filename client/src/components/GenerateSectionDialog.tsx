import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface GenerateSectionDialogProps {
  editionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateSectionDialog({
  editionId,
  open,
  onOpenChange,
}: GenerateSectionDialogProps) {
  // Using sonner toast
  const utils = trpc.useUtils();
  
  const [sectionType, setSectionType] = useState<string>("text");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const [length, setLength] = useState<string>("medium");
  const [context, setContext] = useState("");

  const generateMutation = trpc.sections.generateWithAI.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success("Section generated!");
      onOpenChange(false);
      // Reset form
      setPrompt("");
      setContext("");
    },
    onError: (error) => {
      toast.error(`Failed to generate: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Prompt required - please describe what you want to generate");
      return;
    }

    generateMutation.mutate({
      editionId,
      sectionType: sectionType as any,
      prompt,
      tone: tone as any,
      length: length as any,
      context: context || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate Section with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you want and let AI create the content for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sectionType">Section Type</Label>
            <Select value={sectionType} onValueChange={setSectionType}>
              <SelectTrigger id="sectionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">📰 Header</SelectItem>
                <SelectItem value="text">📝 Text</SelectItem>
                <SelectItem value="article">📄 Article</SelectItem>
                <SelectItem value="quote">💬 Quote</SelectItem>
                <SelectItem value="cta">🎯 Call-to-Action</SelectItem>
                <SelectItem value="list">📋 List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">What do you want to create?</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Write about the latest trends in AI technology..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Input
              id="context"
              placeholder="E.g., This is for a tech newsletter..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex-1"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
