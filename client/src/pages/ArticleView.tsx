import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function ArticleView() {
  const [, params] = useRoute("/edition/:editionId/article/:articleSlug");
  const editionId = params?.editionId ? parseInt(params.editionId) : 0;
  const articleSlug = params?.articleSlug || "";
  const [, setLocation] = useLocation();

  const { data: articles, isLoading } = trpc.articles.list.useQuery(
    { editionId },
    { enabled: editionId > 0 }
  );

  const article = articles?.find((a) => a.slug === articleSlug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Article Content */}
      <article className="container max-w-4xl py-12">
        {/* Category */}
        {article.category && (
          <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase mb-4">
            <Tag className="h-4 w-4" />
            {article.category}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="mb-8">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            {article.imageCaption && (
              <p className="text-sm text-gray-600 italic mt-3 text-center">
                {article.imageCaption}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-6 text-gray-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t mt-12 pt-8">
          <p className="text-center text-gray-600">
            Want more articles like this?{" "}
            <a href="/" className="text-primary font-semibold hover:underline">
              Subscribe to our newsletter
            </a>
          </p>
        </div>
      </article>
    </div>
  );
}
