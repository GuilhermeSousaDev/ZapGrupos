import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AuthModal from "./components/AuthModal";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthModalProvider } from "./contexts/AuthModalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import SearchPage from "./pages/SearchPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MyGroupsPage from "./pages/dashboard/MyGroupsPage";
import CreateGroupPage from "./pages/dashboard/CreateGroupPage";
import EditGroupPage from "./pages/dashboard/EditGroupPage";
import MetricsPage from "./pages/dashboard/MetricsPage";
import PlansPage from "./pages/dashboard/PlansPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminScraper from "./pages/admin/AdminScraper";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/busca" component={SearchPage} />
      <Route path="/categoria/:slug" component={CategoryPage} />
      <Route path="/grupo/:id" component={GroupDetailPage} />

      {/* Dashboard (owner) */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/grupos" component={MyGroupsPage} />
      <Route path="/dashboard/grupos/novo" component={CreateGroupPage} />
      <Route path="/dashboard/grupos/:id/editar" component={EditGroupPage} />
      <Route path="/dashboard/grupos/:id/metricas" component={MetricsPage} />
      <Route path="/dashboard/planos" component={PlansPage} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/grupos" component={AdminGroups} />
      <Route path="/admin/usuarios" component={AdminUsers} />
      <Route path="/admin/scraper" component={AdminScraper} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthModalProvider>
          <TooltipProvider>
            <Toaster theme="dark" position="top-right" />
            <AuthModal />
            <Router />
          </TooltipProvider>
        </AuthModalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
