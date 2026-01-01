import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";

type Article = {
  id: number;
  editionId: number;
  category?: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  imageCaption?: string | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SortableArticleItemProps = {
  article: Article;
  onEdit: (article: Article) => void;
  onDelete: (articleId: number) => void;
};

export function SortableArticleItem({ article, onEdit, onDelete }: SortableArticleItemProps) {
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
      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          {article.category && (
            <span className="text-xs font-semibold text-primary uppercase">
              {article.category}
            </span>
          )}
          <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {article.content.substring(0, 150)}...
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(article)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(article.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
