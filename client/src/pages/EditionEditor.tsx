import { useAuth } from "@/_core/hooks/useAuth";
import { ArticleSelector } from "@/components/ArticleSelector";
import { SectionEditor } from "@/components/SectionEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export function EditionEditor() {
  const [, params] = useRoute("/newsletters/:newsletterId/editions/:editionId");
  const newsletterId = params?.newsletterId ? parseInt(params.newsletterId) : 0;
  const editionId = params?.editionId ? parseInt(params.editionId) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [subject, setSubject] = useState("");
  const [introText, setIntroText] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [templateStyle, setTemplateStyle] = useState<"morning-brew" | "minimalist" | "bold" | "magazine">("morning-brew");

  const { data: edition, isLoading: editionLoading } = trpc.editions.getById.useQuery(
    { id: editionId },
    { enabled: !!user && editionId > 0 }
  );

  const updateEditionMutation = trpc.editions.update.useMutation({
    onSuccess: () => {
      toast.success("Edition saved successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (edition) {
      setSubject(edition.subject || "");
      setIntroText(edition.introText || "");
      setScheduledFor(edition.scheduledFor ? new Date(edition.scheduledFor).toISOString().slice(0, 16) : "");
      setTemplateStyle(edition.templateStyle || "morning-brew");
    }
  }, [edition]);

  if (authLoading || editionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading edition...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!edition) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-600">Edition not found</p>
      </div>
    );
  }

  const handleSaveEdition = () => {
    updateEditionMutation.mutate({
      id: editionId,
      subject,
      introText,
      templateStyle,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/newsletters/${newsletterId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Newsletter
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Edition</h1>
            <p className="text-gray-600 mt-1">Configure your newsletter edition</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveEdition} disabled={updateEditionMutation.isPending}>
              Save Changes
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Newsletter
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Edition Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Edition Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your amazing newsletter subject..."
              />
            </div>
            <div>
              <Label htmlFor="introText">Intro Text (appears before articles)</Label>
              <Textarea
                id="introText"
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="Good morning! Welcome to today's edition..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="templateStyle">Email Template Style</Label>
              <Select value={templateStyle} onValueChange={(value: any) => setTemplateStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning-brew">Morning Brew (Card-based, Blue header)</SelectItem>
                  <SelectItem value="minimalist">Minimalist (Clean, Simple, Serif)</SelectItem>
                  <SelectItem value="bold">Bold (Vibrant, Eye-catching)</SelectItem>
                  <SelectItem value="magazine">Magazine (Editorial, Featured article)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledFor">Schedule Send (optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sections Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionEditor editionId={editionId} />
          </CardContent>
        </Card>

        {/* Article Library Selector */}
        <ArticleSelector newsletterId={edition.newsletterId} editionId={editionId} />
      </div>
    </div>
  );
}
