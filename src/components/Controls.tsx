
import { PaddingValue, StylePreset } from '@/pages/Editor';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import StylePresetSelector from './StylePresetSelector';

interface ControlsProps {
    setPadding: (padding: PaddingValue) => void;
    padding: PaddingValue;
    stylePreset: StylePreset;
    setStylePreset: (preset: StylePreset) => void;
    image: string | null;
    previewRef: React.RefObject<HTMLDivElement>;
}

const Controls = ({ setPadding, padding, stylePreset, setStylePreset, image, previewRef }: ControlsProps) => {
    const handleDownload = () => {
        if (previewRef.current) {
            toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = 'branded-screenshot.png';
                    link.href = dataUrl;
                    link.click();
                })
                .catch((err) => {
                    console.error('Oops, something went wrong!', err);
                });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
            <div className="p-4 space-y-4">
                <Button onClick={handleDownload} disabled={!image} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                </Button>

                <div className="border-t pt-4 space-y-4">
                    <StylePresetSelector 
                        stylePreset={stylePreset}
                        setStylePreset={setStylePreset}
                    />
                    
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Padding Size</Label>
                        <RadioGroup 
                            defaultValue="22px" 
                            value={padding} 
                            onValueChange={(value) => setPadding(value as PaddingValue)} 
                            className="grid grid-cols-1 gap-2"
                        >
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                                <RadioGroupItem value="11px" id="p-sm" />
                                <Label htmlFor="p-sm" className="text-sm font-medium">Small</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                                <RadioGroupItem value="22px" id="p-md" />
                                <Label htmlFor="p-md" className="text-sm font-medium">Medium</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                                <RadioGroupItem value="44px" id="p-lg" />
                                <Label htmlFor="p-lg" className="text-sm font-medium">Large</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;
