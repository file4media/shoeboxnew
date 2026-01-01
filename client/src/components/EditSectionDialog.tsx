import { useState, useEffect } from "react";
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
import { Textarea } from "./ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditSectionDialogProps {
  section: any;
  editionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSectionDialog({
  section,
  editionId,
  open,
  onOpenChange,
}: EditSectionDialogProps) {
  // Using sonner toast
  const utils = trpc.useUtils();
  
  const [title, setTitle] = useState(section.title || "");
  const [subtitle, setSubtitle] = useState(section.subtitle || "");
  const [content, setContent] = useState(section.content || "");
  const [imageUrl, setImageUrl] = useState(section.imageUrl || "");
  const [imageCaption, setImageCaption] = useState(section.imageCaption || "");
  const [buttonText, setButtonText] = useState(section.buttonText || "");
  const [buttonUrl, setButtonUrl] = useState(section.buttonUrl || "");

  // Update form when section changes
  useEffect(() => {
    setTitle(section.title || "");
    setSubtitle(section.subtitle || "");
    setContent(section.content || "");
    setImageUrl(section.imageUrl || "");
    setImageCaption(section.imageCaption || "");
    setButtonText(section.buttonText || "");
    setButtonUrl(section.buttonUrl || "");
  }, [section]);

  const updateMutation = trpc.sections.update.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success("Section updated");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: section.id,
      title: title || undefined,
      subtitle: subtitle || undefined,
      content: content || undefined,
      imageUrl: imageUrl || undefined,
      imageCaption: imageCaption || undefined,
      buttonText: buttonText || undefined,
      buttonUrl: buttonUrl || undefined,
    });
  };

  const renderFields = () => {
    const { sectionType } = section;

    switch (sectionType) {
      case "header":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Enter subtitle..."
                rows={2}
              />
            </div>
          </>
        );

      case "article":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Headline</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter headline..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter article content (markdown supported)..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageCaption">Image Caption (Optional)</Label>
              <Input
                id="imageCaption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Enter caption..."
              />
            </div>
          </>
        );

      case "cta":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="content">Supporting Text</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter supporting text..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Learn More"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonUrl">Button URL</Label>
              <Input
                id="buttonUrl"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        );

      case "image":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageCaption">Caption (Optional)</Label>
              <Input
                id="imageCaption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Enter caption..."
              />
            </div>
          </>
        );

      case "list":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">List Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">List Items</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="- Item 1&#10;- Item 2&#10;- Item 3"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Use - for bullets or 1. for numbered lists
              </p>
            </div>
          </>
        );

      default: // text, quote, etc.
        return (
          <>
            {sectionType !== "quote" && (
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content (markdown supported)..."
                rows={8}
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {section.sectionType} Section</DialogTitle>
          <DialogDescription>
            Update the content for this section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderFields()}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
