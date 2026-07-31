import { useState, useRef, useEffect } from "react";
import ImagePreview from "@/components/ImagePreview";
import Controls from "@/components/Controls";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { PaddingValue, StylePreset } from "./Editor";

const ProgramizEditor = () => {
  const [image, setImage] = useState<string | null>(null);
  const [padding, setPadding] = useState<PaddingValue>("22px");
  const [stylePreset, setStylePreset] = useState<StylePreset>("centered");
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file && file.type === "image/png") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a PNG file.");
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div
      className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100"
      style={{
        // Branded frame color for this page — #EFE5FF (HSL components for hsl(var(--branded-bg)))
        '--branded-bg': '263 100% 94.9%', /* #EFE5FF */
        '--branded-border': '263 38% 87%', /* ~#DBD1EA */
      } as React.CSSProperties}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept="image/png"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl flex-grow flex flex-col overflow-auto">
        <header className="mb-6">
          <Link to="/" className="text-primary hover:underline inline-flex w-fit items-center text-sm font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-grow">
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Controls
              setPadding={setPadding}
              padding={padding}
              stylePreset={stylePreset}
              setStylePreset={setStylePreset}
              image={image}
              previewRef={previewRef}
            />
          </div>

          <div className="xl:col-span-3 order-1 xl:order-2 flex items-start justify-center w-full">
            <ImagePreview
              image={image}
              padding={padding}
              stylePreset={stylePreset}
              ref={previewRef}
              isDragging={isDragging}
              onClick={handleClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramizEditor;
