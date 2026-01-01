import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  GripVertical,
  Trash2,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { EditSectionDialog } from "./EditSectionDialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SortableSectionProps {
  section: any;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  editionId: number;
}

export function SortableSection({
  section,
  onDelete,
  onDuplicate,
  editionId,
}: SortableSectionProps) {
  // Using sonner toast
  const [showEditDialog, setShowEditDialog] = useState(false);
  const utils = trpc.useUtils();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const toggleVisibilityMutation = trpc.sections.update.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success(section.isVisible ? "Section hidden" : "Section visible");
    },
  });

  const handleToggleVisibility = () => {
    toggleVisibilityMutation.mutate({
      id: section.id,
      isVisible: !section.isVisible,
    });
  };

  const getSectionIcon = (type: string) => {
    const icons: Record<string, string> = {
      header: "📰",
      text: "📝",
      article: "📄",
      quote: "💬",
      image: "🖼️",
      cta: "🎯",
      divider: "➖",
      list: "📋",
      code: "💻",
      video: "🎥",
    };
    return icons[type] || "📦";
  };

  const getSectionPreview = () => {
    if (section.title) return section.title;
    if (section.content) {
      const preview = section.content.substring(0, 100);
      return preview.length < section.content.length ? `${preview}...` : preview;
    }
    return `${section.sectionType} section`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-4 ${!section.isVisible ? "opacity-50" : ""}`}>
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Section icon */}
          <div className="text-2xl mt-0.5">{getSectionIcon(section.sectionType)}</div>

          {/* Section content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {section.sectionType}
              </span>
              {section.aiGenerated && (
                <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            <p className="text-sm font-medium line-clamp-2">{getSectionPreview()}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVisibility}
              title={section.isVisible ? "Hide section" : "Show section"}
            >
              {section.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              title="Edit section"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(section.id)}
              title="Duplicate section"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(section.id)}
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <EditSectionDialog
        section={section}
        editionId={editionId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  );
}
