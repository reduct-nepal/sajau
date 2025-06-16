
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Film } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <main className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4 animate-fade-in-down">
          Make your Reduct screenshots shine
        </h1>
        <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl animate-fade-in-up">
          Sajau helps you instantly decorate and beautify your Reduct screenshots with clean, branded borders. Just upload, select a preset style, and export.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/editor">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Brand a PNG
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="relative">
              <Link to="/gif-editor">
                <Button size="lg" variant="outline">
                  Convert Video to GIF
                  <Film className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Badge className="absolute -top-3 -right-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm">
                Coming Soon
              </Badge>
            </div>
        </div>
      </main>
      <footer className="py-4">
        <p className="text-sm text-gray-400">Built with ❤️ by Lovable</p>
      </footer>
    </div>
  );
};

export default Index;
