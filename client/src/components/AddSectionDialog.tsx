import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AddSectionDialogProps {
  editionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sectionTypes = [
  { type: "header", icon: "📰", label: "Header", description: "Title and subtitle" },
  { type: "text", icon: "📝", label: "Text", description: "Rich text content" },
  { type: "article", icon: "📄", label: "Article", description: "Article with image" },
  { type: "quote", icon: "💬", label: "Quote", description: "Blockquote" },
  { type: "image", icon: "🖼️", label: "Image", description: "Full-width image" },
  { type: "cta", icon: "🎯", label: "Call-to-Action", description: "Button with text" },
  { type: "divider", icon: "➖", label: "Divider", description: "Visual separator" },
  { type: "list", icon: "📋", label: "List", description: "Bullet or numbered list" },
] as const;

export function AddSectionDialog({
  editionId,
  open,
  onOpenChange,
}: AddSectionDialogProps) {
  const utils = trpc.useUtils();

  const createMutation = trpc.sections.create.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success("Section added");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to add section: ${error.message}`);
    },
  });

  const handleSelectType = (type: string) => {
    createMutation.mutate({
      editionId,
      sectionType: type as any,
      displayOrder: 999, // Will be reordered by user
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Choose a section type to add to your newsletter
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {sectionTypes.map((section) => (
            <button
              key={section.type}
              onClick={() => handleSelectType(section.type)}
              disabled={createMutation.isPending}
              className="flex items-start gap-3 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl">{section.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{section.label}</div>
                <div className="text-sm text-muted-foreground">
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
