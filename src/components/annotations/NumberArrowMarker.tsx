import { ANNOTATION_COLOR } from '@/lib/annotations';

interface NumberArrowMarkerProps {
    width: number;
    height: number;
    value: number;
}

/**
 * A numbered badge with an arrow trailing to the right. The whole marker is
 * rotated by its parent, so the arrow can be aimed anywhere on the screenshot.
 */
const NumberArrowMarker = ({ width, height, value }: NumberArrowMarkerProps) => {
    const radius = height / 2;
    const stroke = Math.max(2, height * 0.12);
    const headLength = height * 0.42;
    const headHalf = height * 0.34;
    // Badge on the right, arrow pointing left — rotate the marker to aim it.
    const badgeCenter = width - radius;
    const tipX = stroke / 2;
    // The shaft starts on the badge's edge so the two always touch.
    const shaftStart = Math.max(tipX + headLength, badgeCenter - radius + stroke * 0.25);

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', overflow: 'visible' }}
        >
            <line
                x1={shaftStart}
                y1={radius}
                x2={tipX}
                y2={radius}
                stroke={ANNOTATION_COLOR}
                strokeWidth={stroke}
                strokeLinecap="round"
            />
            <polyline
                points={`${tipX + headLength},${radius - headHalf} ${tipX},${radius} ${tipX + headLength},${radius + headHalf}`}
                fill="none"
                stroke={ANNOTATION_COLOR}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={badgeCenter} cy={radius} r={radius} fill={ANNOTATION_COLOR} />
            <text
                x={badgeCenter}
                y={radius}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize={height * 0.6}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
            >
                {value}
            </text>
        </svg>
    );
};

export default NumberArrowMarker;
