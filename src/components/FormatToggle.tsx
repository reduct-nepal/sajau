import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

export type ExportFormat = "png" | "gif";

interface FormatToggleProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
}

const FormatToggle = ({ value, onChange, disabled }: FormatToggleProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">Export Format</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ExportFormat)}
        className="w-full"
        disabled={disabled}
      >
        <ToggleGroupItem value="png" className="flex-1" aria-label="PNG">
          PNG
        </ToggleGroupItem>
        <ToggleGroupItem value="gif" className="flex-1" aria-label="GIF">
          GIF
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default FormatToggle;
