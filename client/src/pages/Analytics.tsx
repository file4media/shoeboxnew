import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Loader2, Mail, Eye, Users, TrendingUp } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function Analytics() {
  const [, params] = useRoute("/newsletters/:id/analytics");
  const newsletterId = params?.id ? parseInt(params.id) : 0;
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: analytics, isLoading } = trpc.newsletters.getAnalytics.useQuery(
    { newsletterId },
    { enabled: !!user && newsletterId > 0 }
  );

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => setLocation(`/newsletters/${newsletterId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletter
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your newsletter performance</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalSubscribers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active subscribers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEmailsSent}</div>
                  <p className="text-xs text-muted-foreground">
                    Emails delivered
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOpens}</div>
                  <p className="text-xs text-muted-foreground">
                    Email opens tracked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalEmailsSent > 0
                      ? `${((analytics.totalOpens / analytics.totalEmailsSent) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average open rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Editions Performance</CardTitle>
                <CardDescription>Performance metrics for your recent newsletter editions</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentEditions && analytics.recentEditions.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentEditions.map((edition: any) => (
                      <div key={edition.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{edition.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {edition.sentAt ? new Date(edition.sentAt).toLocaleDateString() : "Not sent"}
                          </p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-bold">{edition.totalRecipients || 0}</div>
                            <div className="text-muted-foreground">Sent</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{edition.uniqueOpens || 0}</div>
                            <div className="text-muted-foreground">Opens</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">
                              {edition.totalRecipients && edition.totalRecipients > 0
                                ? `${((edition.uniqueOpens || 0) / edition.totalRecipients * 100).toFixed(1)}%`
                                : "0%"}
                            </div>
                            <div className="text-muted-foreground">Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No editions sent yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <p className="text-muted-foreground">No analytics data available</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
