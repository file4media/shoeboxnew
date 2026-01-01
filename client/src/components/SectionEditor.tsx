import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Plus, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AddSectionDialog } from "./AddSectionDialog";
import { GenerateSectionDialog } from "./GenerateSectionDialog";

interface SectionEditorProps {
  editionId: number;
}

export function SectionEditor({ editionId }: SectionEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: sections = [], isLoading } = trpc.sections.list.useQuery({ editionId });
  
  const reorderMutation = trpc.sections.reorder.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`);
    },
  });

  const deleteMutation = trpc.sections.delete.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success("Section deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const duplicateMutation = trpc.sections.duplicate.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ editionId });
      toast.success("Section duplicated");
    },
    onError: (error) => {
      toast.error(`Failed to duplicate: ${error.message}`);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      const updates = newSections.map((section, index) => ({
        id: section.id,
        displayOrder: index,
      }));

      reorderMutation.mutate({ updates });
    }
  };

  const handleDelete = (sectionId: number) => {
    if (confirm("Are you sure you want to delete this section?")) {
      deleteMutation.mutate({ id: sectionId });
    }
  };

  const handleDuplicate = (sectionId: number) => {
    duplicateMutation.mutate({ id: sectionId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setShowAddDialog(true)} className="flex-1">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
        <Button
          onClick={() => setShowGenerateDialog(true)}
          variant="outline"
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-4xl">📝</div>
            <h3 className="text-lg font-semibold">No sections yet</h3>
            <p className="text-sm text-muted-foreground">
              Start building your newsletter by adding sections manually or generating them with AI.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
              <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  editionId={editionId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddSectionDialog
        editionId={editionId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <GenerateSectionDialog
        editionId={editionId}
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  );
}
