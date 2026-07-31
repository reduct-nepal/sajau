
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";
import DocsToHelpIndex from "./pages/DocsToHelpIndex";
import DocsToHelpEditor from "./pages/DocsToHelpEditor";
import TiggIndex from "./pages/TiggIndex";
import TiggEditor from "./pages/TiggEditor";
import ProgramizEditor from "./pages/ProgramizEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/gif-editor" element={<Navigate to="/editor?format=gif" replace />} />
          <Route path="/docs-to-help" element={<DocsToHelpIndex />} />
          <Route path="/docs-to-help/editor" element={<DocsToHelpEditor />} />
          <Route path="/tigg" element={<TiggIndex />} />
          <Route path="/tigg/editor" element={<TiggEditor />} />
          <Route path="/programiz" element={<ProgramizEditor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
