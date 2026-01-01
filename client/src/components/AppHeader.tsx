import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AppHeader() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/newsletters")}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span className="font-semibold">Newsletter Platform</span>
          </Button>

          <nav className="flex items-center gap-2">
            <Button
              variant={location === "/newsletters" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLocation("/newsletters")}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user.name || user.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
