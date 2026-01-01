import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Loader2, Sparkles, Send, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function EditionEditor() {
  const [, params] = useRoute("/newsletters/:newsletterId/editions/:editionId");
  const newsletterId = params?.newsletterId ? parseInt(params.newsletterId) : 0;
  const editionId = params?.editionId ? parseInt(params.editionId) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "friendly" | "formal">("professional");
  const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");

  const { data: edition, isLoading: editionLoading } = trpc.editions.getById.useQuery(
    { id: editionId },
    { enabled: !!user && editionId > 0 }
  );

  const updateMutation = trpc.editions.update.useMutation({
    onSuccess: () => {
      toast.success("Edition saved successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateMutation = trpc.ai.generateContent.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      setSubject(data.title);
      setIsAIDialogOpen(false);
      toast.success("Content generated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendMutation = trpc.email.send.useMutation({
    onSuccess: () => {
      toast.success("Newsletter sent successfully");
      setIsSendDialogOpen(false);
      setLocation(`/newsletters/${newsletterId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendTestMutation = trpc.email.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Test email sent successfully");
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (edition) {
      setSubject(edition.subject);
      setContent(edition.contentMarkdown || "");
    }
  }, [edition]);

  if (authLoading || editionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!edition) {
    return <div>Edition not found</div>;
  }

  const handleSave = () => {
    updateMutation.mutate({
      id: editionId,
      subject,
      contentMarkdown: content,
    });
  };

  const handleGenerateAI = () => {
    if (!aiTopic) {
      toast.error("Please enter a topic");
      return;
    }
    generateMutation.mutate({
      topic: aiTopic,
      tone: aiTone,
      length: aiLength,
    });
  };

  const handleSend = () => {
    const baseUrl = window.location.origin;
    sendMutation.mutate({
      editionId,
      baseUrl,
    });
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error("Please enter a test email");
      return;
    }
    const baseUrl = window.location.origin;
    sendTestMutation.mutate({
      editionId,
      testEmail,
      baseUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setLocation(`/newsletters/${newsletterId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Newsletter
            </Button>
            <div className="flex gap-2">
              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Content with AI</DialogTitle>
                    <DialogDescription>
                      Let AI create engaging newsletter content for you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Latest trends in AI technology"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tone">Tone</Label>
                      <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="length">Length</Label>
                      <Select value={aiLength} onValueChange={(v: any) => setAiLength(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (300-400 words)</SelectItem>
                          <SelectItem value="medium">Medium (600-800 words)</SelectItem>
                          <SelectItem value="long">Long (1000-1500 words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateAI} disabled={generateMutation.isPending}>
                      {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Newsletter</DialogTitle>
                    <DialogDescription>
                      This will send the newsletter to all active subscribers. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="testEmail">Send Test Email First (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="testEmail"
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                        <Button onClick={handleSendTest} disabled={sendTestMutation.isPending}>
                          {sendTestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send Test
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={sendMutation.isPending}>
                      {sendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send to All Subscribers
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-lg"
              placeholder="Enter your subject line"
            />
          </div>

          <div>
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono"
              placeholder="Write your newsletter content in markdown..."
            />
          </div>
        </div>
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{subject || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
