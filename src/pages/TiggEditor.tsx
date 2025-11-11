import { useState, useRef, useEffect } from "react";
import DocsToHelpPreview from "@/components/DocsToHelpPreview";
import Controls from "@/components/Controls";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { PaddingValue, StylePreset } from "./DocsToHelpEditor";

const COLOR_OPTIONS = [
  { label: "Light", value: "light", bg: "#EFF1F8", border: "#EFF1F8" },
  { label: "bright", value: "bright", bg: "#143E9F", border: "#143E9F" },
];

const TIGG_FRAME_COLORS = {
  light: { bg: '#EFF1F8', border: '#EFF1F8' },
  bright: { bg: '#143E9F', border: '#143E9F' }
};

const TiggEditor = () => {
  const [image, setImage] = useState<string | null>(null);
  const [padding, setPadding] = useState<PaddingValue>("22px");
  const [stylePreset, setStylePreset] = useState<StylePreset>("centered");
  const [colorOption, setColorOption] = useState("bright");
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#EFF1F8] to-[#143E9F]" onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept="image/png"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl flex-grow flex flex-col overflow-auto">
        <header className="mb-6">
          <Link to="/tigg" className="text-[#143E9F] hover:underline flex items-center text-sm font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tigg Home
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
              colorOption={colorOption}
              setColorOption={setColorOption}
              colorOptions={COLOR_OPTIONS}
            />
          </div>
          <div className="xl:col-span-3 order-1 xl:order-2 flex items-start justify-center w-full">
            <DocsToHelpPreview
              image={image}
              padding={padding}
              stylePreset={stylePreset}
              ref={previewRef}
              isDragging={isDragging}
              onClick={handleClick}
              colorOption={colorOption}
              frameColors={TIGG_FRAME_COLORS}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiggEditor;
