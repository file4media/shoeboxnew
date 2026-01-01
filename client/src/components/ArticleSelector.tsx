import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ArticleSelectorProps {
  newsletterId: number;
  editionId: number;
}

function SortableArticle({ article, onRemove }: { article: any; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-card border rounded-lg"
    >
      <button
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{article.title}</div>
        {article.category && (
          <Badge variant="secondary" className="mt-1">
            {article.category}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function ArticleSelector({ newsletterId, editionId }: ArticleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  const { data: allArticles = [] } = trpc.articles.list.useQuery(
    { newsletterId },
    { enabled: !!newsletterId }
  );

  const { data: editionArticles = [], refetch } = trpc.editionArticles.list.useQuery(
    { editionId },
    { enabled: !!editionId }
  );

  const addArticle = trpc.editionArticles.add.useMutation({
    onSuccess: () => {
      toast.success("Article added");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeArticle = trpc.editionArticles.remove.useMutation({
    onSuccess: () => {
      toast.success("Article removed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reorderArticles = trpc.editionArticles.reorder.useMutation({
    onSuccess: () => {
      toast.success("Articles reordered");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
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
      const oldIndex = editionArticles.findIndex((a) => a.id === active.id);
      const newIndex = editionArticles.findIndex((a) => a.id === over.id);

      const newOrder = arrayMove(editionArticles, oldIndex, newIndex);
      const articleIds = newOrder.map((a) => a.id);

      reorderArticles.mutate({ editionId, articleIds });
    }
  };

  const availableArticles = allArticles.filter(
    (article) =>
      !editionArticles.some((ea) => ea.id === article.id) &&
      (article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.category && article.category.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles</CardTitle>
        <CardDescription>
          Select articles from your library to include in this edition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editionArticles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No articles added yet</p>
            <Button onClick={() => setShowLibrary(!showLibrary)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Articles
            </Button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={editionArticles.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {editionArticles.map((article) => (
                    <SortableArticle
                      key={article.id}
                      article={article}
                      onRemove={() =>
                        removeArticle.mutate({ editionId, articleId: article.id })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              onClick={() => setShowLibrary(!showLibrary)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Articles
            </Button>
          </>
        )}

        {showLibrary && (
          <div className="border-t pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {availableArticles.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {searchQuery ? "No matching articles" : "All articles have been added"}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{article.title}</div>
                      {article.category && (
                        <Badge variant="secondary" className="mt-1">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        addArticle.mutate({ editionId, articleId: article.id })
                      }
                      disabled={addArticle.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
