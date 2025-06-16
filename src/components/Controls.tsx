import { PaddingValue, StylePreset } from '@/pages/Editor';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toPng } from 'html-to-image';
import { Download, Copy } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
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
            toPng(previewRef.current, { 
                cacheBust: true, 
                pixelRatio: 2,
                style: {
                    boxShadow: 'none' // Remove shadow from export
                }
            })
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

    const handleCopy = async () => {
        if (previewRef.current) {
            try {
                const dataUrl = await toPng(previewRef.current, { 
                    cacheBust: true, 
                    pixelRatio: 2,
                    style: {
                        boxShadow: 'none' // Remove shadow from export
                    }
                });
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                toast("Image copied to clipboard!");
                console.log('Image copied to clipboard');
            } catch (err) {
                console.error('Failed to copy image:', err);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
            <div className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleDownload} disabled={!image} className="w-full md:flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                    </Button>
                    <Button onClick={handleCopy} disabled={!image} variant="outline" className="w-full md:flex-1">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Padding Size</Label>
                        <RadioGroup 
                            value={padding}
                            onValueChange={(value: PaddingValue) => setPadding(value)}
                            className="flex flex-row space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="11px" id="r1" />
                                <Label htmlFor="r1">Small</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="22px" id="r2" />
                                <Label htmlFor="r2">Medium</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="44px" id="r3" />
                                <Label htmlFor="r3">Large</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <StylePresetSelector 
                        stylePreset={stylePreset}
                        setStylePreset={setStylePreset}
                    />
                </div>
            </div>
        </div>
    );
};

export default Controls;
