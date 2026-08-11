interface CursorMarkerProps {
    width: number;
    height: number;
}

/**
 * A classic OS mouse-pointer arrow — white fill with a dark outline, tip at
 * the top-left so it lands exactly where the user clicks.
 */
const CursorMarker = ({ width, height }: CursorMarkerProps) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 17 24"
        style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
    >
        <path
            d="M1 1L1 19.5L5.5 15.3L8.4 22L11.3 20.7L8.4 14L15 14L1 1Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={1.4}
            strokeLinejoin="round"
        />
    </svg>
);

export default CursorMarker;
