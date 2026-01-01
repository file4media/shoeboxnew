import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Mail, Sparkles, BarChart3, Users, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    setLocation("/newsletters");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Newsletter Platform</span>
          </div>
          <Button onClick={() => setLocation("/login")}>
            Sign In
          </Button>
        </div>
      </header>

      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Create Amazing Newsletters with{" "}
              <span className="text-primary">AI Power</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build, manage, and grow multiple newsletters with AI-powered content generation,
              beautiful templates, and powerful analytics.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/login")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Content</CardTitle>
                <CardDescription>
                  Generate engaging newsletter content with advanced AI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Newsletter</CardTitle>
                <CardDescription>
                  Manage multiple newsletters from one dashboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Subscriber Management</CardTitle>
                <CardDescription>
                  Organize and segment your audience effectively
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Track opens, engagement, and growth metrics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
