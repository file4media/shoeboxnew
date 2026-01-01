import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
}

export function EmailPreviewDialog({ open, onOpenChange, editionId }: EmailPreviewDialogProps) {
  const { data: previewHtml, isLoading } = trpc.editions.getPreviewHtml.useQuery(
    { editionId },
    { enabled: open && editionId > 0 }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto border rounded-lg bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full min-h-[600px]"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
