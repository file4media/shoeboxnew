import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Newsletters from "./pages/Newsletters";
import NewsletterDetail from "./pages/NewsletterDetail";
import EditionEditor from "./pages/EditionEditor";
import Subscribers from "./pages/Subscribers";
import Analytics from "./pages/Analytics";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/newsletters"} component={Newsletters} />
      <Route path={"/newsletters/:id"} component={NewsletterDetail} />
      <Route path={"/newsletters/:newsletterId/editions/:editionId"} component={EditionEditor} />
      <Route path={"/newsletters/:id/subscribers"} component={Subscribers} />
      <Route path={"/newsletters/:id/analytics"} component={Analytics} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
