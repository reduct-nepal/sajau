import { RefObject, useEffect, useState } from 'react';

export interface ContentRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

const ZERO: ContentRect = { left: 0, top: 0, width: 0, height: 0 };

const same = (a: ContentRect, b: ContentRect) =>
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5;

/**
 * The rectangle actually covered by the pixels of an `object-contain` image,
 * relative to the `<img>` element's own box. Annotations are positioned against
 * this so the image edge really is the limit, letterboxing included.
 */
export const useImageContentRect = (imgRef: RefObject<HTMLImageElement>, enabled: boolean): ContentRect => {
    const [rect, setRect] = useState<ContentRect>(ZERO);

    useEffect(() => {
        const img = imgRef.current;
        if (!enabled || !img) {
            setRect((current) => (same(current, ZERO) ? current : ZERO));
            return;
        }

        const measure = () => {
            const boxWidth = img.clientWidth;
            const boxHeight = img.clientHeight;
            if (!boxWidth || !boxHeight) return;

            const { naturalWidth, naturalHeight } = img;
            let next: ContentRect;
            if (!naturalWidth || !naturalHeight) {
                next = { left: 0, top: 0, width: boxWidth, height: boxHeight };
            } else {
                const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
                const width = naturalWidth * scale;
                const height = naturalHeight * scale;
                next = { left: (boxWidth - width) / 2, top: (boxHeight - height) / 2, width, height };
            }
            setRect((current) => (same(current, next) ? current : next));
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(img);
        img.addEventListener('load', measure);
        return () => {
            observer.disconnect();
            img.removeEventListener('load', measure);
        };
    }, [imgRef, enabled]);

    return rect;
};
