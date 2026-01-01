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
import { ArrowLeft, Loader2, Sparkles, Send, Eye, Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

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

export default function EditionEditor() {
  const [, params] = useRoute("/newsletters/:newsletterId/editions/:editionId");
  const newsletterId = params?.newsletterId ? parseInt(params.newsletterId) : 0;
  const editionId = params?.editionId ? parseInt(params.editionId) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [subject, setSubject] = useState("");
  const [introText, setIntroText] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  
  // Article editor state
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleImageUrl, setArticleImageUrl] = useState("");
  const [articleImageCaption, setArticleImageCaption] = useState("");
  
  // AI and image dialogs
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  
  // Send dialog
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data: edition, isLoading: editionLoading } = trpc.editions.getById.useQuery(
    { id: editionId },
    { enabled: !!user && editionId > 0 }
  );

  const { data: articles = [], refetch: refetchArticles } = trpc.articles.list.useQuery(
    { editionId },
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

  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      toast.success("Article created successfully");
      refetchArticles();
      closeArticleDialog();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      toast.success("Article updated successfully");
      refetchArticles();
      closeArticleDialog();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteArticleMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success("Article deleted successfully");
      refetchArticles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateContentMutation = trpc.ai.generateContent.useMutation({
    onSuccess: (data) => {
      setArticleContent(data.content);
      toast.success("Content generated successfully");
      setIsAIDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: imageResults } = trpc.images.search.useQuery(
    { query: imageQuery, perPage: 12 },
    { enabled: imageQuery.length > 0 }
  );

  const sendTestMutation = trpc.email.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Test email sent successfully");
      setIsSendDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendMutation = trpc.email.send.useMutation({
    onSuccess: () => {
      toast.success("Newsletter sent successfully");
      setIsSendDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (edition) {
      setSubject(edition.subject);
      setIntroText(edition.introText || "");
      if (edition.scheduledFor) {
        const date = new Date(edition.scheduledFor);
        setScheduledFor(date.toISOString().slice(0, 16));
      }
    }
  }, [edition]);

  const handleSaveEdition = () => {
    updateEditionMutation.mutate({
      id: editionId,
      subject,
      introText,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });
  };

  const openArticleDialog = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setArticleTitle(article.title);
      setArticleCategory(article.category || "");
      setArticleContent(article.content);
      setArticleImageUrl(article.imageUrl || "");
      setArticleImageCaption(article.imageCaption || "");
    }
    setIsArticleDialogOpen(true);
  };

  const closeArticleDialog = () => {
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
    setArticleTitle("");
    setArticleCategory("");
    setArticleContent("");
    setArticleImageUrl("");
    setArticleImageCaption("");
  };

  const handleSaveArticle = () => {
    const slug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    if (editingArticle) {
      updateArticleMutation.mutate({
        id: editingArticle.id,
        title: articleTitle,
        category: articleCategory || undefined,
        content: articleContent,
        imageUrl: articleImageUrl || undefined,
        imageCaption: articleImageCaption || undefined,
        slug,
      });
    } else {
      createArticleMutation.mutate({
        editionId,
        title: articleTitle,
        category: articleCategory || undefined,
        content: articleContent,
        imageUrl: articleImageUrl || undefined,
        imageCaption: articleImageCaption || undefined,
        slug,
        displayOrder: articles.length,
      });
    }
  };

  const handleDeleteArticle = (articleId: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticleMutation.mutate({ id: articleId });
    }
  };

  const handleGenerateContent = () => {
    generateContentMutation.mutate({
      topic: aiTopic,
      tone: "professional",
      length: "medium",
    });
  };

  const handleSelectImage = (imageUrl: string) => {
    setArticleImageUrl(imageUrl);
    setIsImageSearchOpen(false);
    toast.success("Image selected");
  };

  const handleSendTest = () => {
    sendTestMutation.mutate({
      editionId,
      testEmail,
      baseUrl: window.location.origin,
    });
  };

  const handleSend = () => {
    if (confirm("Are you sure you want to send this newsletter to all subscribers?")) {
      sendMutation.mutate({
        editionId,
        baseUrl: window.location.origin,
      });
    }
  };

  if (authLoading || editionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!edition) {
    return (
      <div className="container py-8">
        <p>Edition not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/newsletters/${newsletterId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletter
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSendDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button onClick={handleSaveEdition} disabled={updateEditionMutation.isPending}>
              {updateEditionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Edition
            </Button>
          </div>
        </div>

        {/* Edition Settings */}
        <Card className="mb-6">
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
                rows={3}
              />
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

        {/* Articles Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button onClick={() => openArticleDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No articles yet. Click "Add Article" to create your first article card.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 cursor-move">
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
                          onClick={() => openArticleDialog(article)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteArticle(article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Article Editor Dialog */}
        <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Create Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="articleCategory">Category (optional)</Label>
                <Input
                  id="articleCategory"
                  value={articleCategory}
                  onChange={(e) => setArticleCategory(e.target.value)}
                  placeholder="FINANCE, TECH, BUSINESS..."
                />
              </div>
              <div>
                <Label htmlFor="articleTitle">Title</Label>
                <Input
                  id="articleTitle"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Your article headline..."
                />
              </div>
              <div>
                <Label>Featured Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={articleImageUrl}
                    onChange={(e) => setArticleImageUrl(e.target.value)}
                    placeholder="Image URL..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsImageSearchOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                {articleImageUrl && (
                  <img
                    src={articleImageUrl}
                    alt="Preview"
                    className="mt-2 w-full h-48 object-cover rounded"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="articleImageCaption">Image Caption (optional)</Label>
                <Input
                  id="articleImageCaption"
                  value={articleImageCaption}
                  onChange={(e) => setArticleImageCaption(e.target.value)}
                  placeholder="Photo credit or caption..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="articleContent">Content</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAIDialogOpen(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="articleContent"
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Write your article content here..."
                  rows={12}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeArticleDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveArticle}
                disabled={!articleTitle || !articleContent || createArticleMutation.isPending || updateArticleMutation.isPending}
              >
                {(createArticleMutation.isPending || updateArticleMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingArticle ? "Update" : "Create"} Article
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Content Dialog */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Content with AI</DialogTitle>
              <DialogDescription>
                Describe what you want to write about, and AI will generate content for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="aiTopic">Topic</Label>
                <Textarea
                  id="aiTopic"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="E.g., Write about the latest AI developments in 2025..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateContent}
                disabled={!aiTopic || generateContentMutation.isPending}
              >
                {generateContentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Search Dialog */}
        <Dialog open={isImageSearchOpen} onOpenChange={setIsImageSearchOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Search Images</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                value={imageQuery}
                onChange={(e) => setImageQuery(e.target.value)}
                placeholder="Search for images..."
              />
              {imageResults && imageResults.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {imageResults.map((img: any) => (
                    <div
                      key={img.id}
                      className="cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => handleSelectImage(img.urls.regular)}
                    >
                      <img
                        src={img.urls.small}
                        alt={img.description || "Image"}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Newsletter</DialogTitle>
              <DialogDescription>
                Send this edition to all subscribers or send a test email first.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={!testEmail || sendTestMutation.isPending}
              >
                {sendTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Test
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send to All Subscribers
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
