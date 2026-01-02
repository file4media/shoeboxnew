import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Newsletters from "./pages/Newsletters";
import NewsletterDetail from "./pages/NewsletterDetail";
import { EditionEditor } from "@/pages/EditionEditor";
import Subscribers from "./pages/Subscribers";
import Analytics from "./pages/Analytics";
// import ArticleView from "./pages/ArticleView";
import Articles from "./pages/Articles";
import Authors from "./pages/Authors";
import Calendar from "./pages/Calendar";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/newsletters"} component={Newsletters} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/newsletters/:id"} component={NewsletterDetail} />
      <Route path={"/newsletters/:newsletterId/editions/:editionId"} component={EditionEditor} />
      <Route path={"/newsletters/:newsletterId/articles"} component={Articles} />
      <Route path={"/newsletters/:newsletterId/authors"} component={Authors} />
      <Route path={"/newsletters/:id/subscribers"} component={Subscribers} />
      <Route path={"/newsletters/:id/analytics"} component={Analytics} />
      {/* <Route path={"/edition/:editionId/article/:articleSlug"} component={ArticleView} /> */}
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
