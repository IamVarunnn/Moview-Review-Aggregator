import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    useTheme,
    alpha,
    Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface RatingDistribution {
    rating: number; // 1 to 5
    count: number;
    percentage: number; // 0 to 100
}

interface RatingsDistributionProps {
    distributions: RatingDistribution[];
    totalRatings: number;
    title?: string;
}

// Modern glass-morphic container with animated gradient
const GlassmorphicContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginBottom: theme.spacing(4),
    borderRadius: 16,
    backgroundColor: 'rgba(17, 25, 40, 0.75)',
    backdropFilter: 'blur(16px) saturate(180%)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(49, 29, 94, 0.3) 0%, rgba(25, 29, 100, 0.3) 100%)',
        zIndex: -1,
        animation: 'gradientShift 10s ease-in-out infinite',
    },
}));

// Stylish tag chips
const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 'bold',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    height: 32,
    cursor: 'pointer',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    '& .MuiChip-label': {
        padding: '0 12px',
    },
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

// Modern tooltip with glass effect and arrow
const GlassTooltip = styled(Box)(({ theme }) => ({
    position: 'absolute',
    backgroundColor: 'rgba(17, 25, 40, 0.85)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#fff',
    padding: theme.spacing(2),
    borderRadius: 12,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    fontSize: '0.85rem',
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    opacity: 0,
    transform: 'translateY(10px)',
    '&.visible': {
        opacity: 1,
        transform: 'translateY(0)',
    },
    width: 180,
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '6px 6px 0 6px',
        borderStyle: 'solid',
        borderColor: 'rgba(255, 255, 255, 0.18) transparent transparent transparent',
    },
}));

// Rating indicator
const RatingIndicator = styled(Box)<{ value: number }>(({ theme, value }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: 40,
    height: 40,
    background: `conic-gradient(from 0deg, #FF4396 0%, #FF4396 ${value * 20}%, rgba(255, 255, 255, 0.1) ${value * 20}%, rgba(255, 255, 255, 0.1) 100%)`,
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
}));

// Enhanced progress bar with gradient
const ProgressBar = styled(Box)<{ value: number; color: string }>(({ theme, value, color }) => ({
    height: 10,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        height: '100%',
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
        borderRadius: 10,
        left: 0,
        top: 0,
        transition: 'width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: `0 0 10px ${color}`,
    },
}));

const RatingsDistribution: React.FC<RatingsDistributionProps> = ({
    distributions,
    totalRatings,
    title = "Rating Distribution",
}) => {
    const theme = useTheme();
    const chartRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{
        x: number;
        y: number;
        label: string;
        value: number;
        rating: number;
    } | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [animate, setAnimate] = useState(false);
    const [showCountLine, setShowCountLine] = useState(true);
    const [showPercentageLine, setShowPercentageLine] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 600, height: 330 });

    // Custom vibrant colors
    const colors = {
        primary: '#6C5DD3', // Purple
        secondary: '#FF4396', // Pink
        accent: '#4FD8DE', // Teal
        success: '#7FBA7A', // Green
        warning: '#FFCE73', // Amber
        background: {
            dark: 'rgba(17, 25, 40, 0.95)',
            light: '#ffffff',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
        grid: 'rgba(255, 255, 255, 0.07)',
    };

    // Animation timing
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    // Handle responsive dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const newWidth = Math.min(containerWidth, 600);
                const newHeight = (newWidth / 600) * 330; // Maintain aspect ratio
                setDimensions({ width: newWidth, height: newHeight });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Ensure all 5 rating levels are included, even with zero counts
    const completeDistributions = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => {
            const dist = distributions.find((d) => d.rating === i + 1) || {
                rating: i + 1,
                count: 0,
                percentage: 0,
            };
            return dist;
        });
    }, [distributions]);

    // Chart dimensions
    const { width, height } = dimensions;
    const padding = { top: 30, right: 40, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Data processing
    const countData = useMemo(() => completeDistributions.map((dist) => dist.count), [completeDistributions]);
    const percentageData = useMemo(() => completeDistributions.map((dist) => dist.percentage), [completeDistributions]);
    const maxCount = Math.max(...countData, 1);
    const maxPercentage = Math.max(...percentageData, 1);

    // X positions for each rating
    const xStep = chartWidth / (completeDistributions.length - 1);
    const xPositions = useMemo(() => completeDistributions.map((_, i) => padding.left + i * xStep), [chartWidth, completeDistributions]);

    // Calculate trend and average
    const countTrend = useMemo(() => ((countData[4] - countData[0]) / (countData[0] || 1)) * 100, [countData]);
    const ratingsAvg = useMemo(
        () =>
            completeDistributions.reduce((acc, curr) => acc + curr.rating * curr.percentage, 0) /
            completeDistributions.reduce((acc, curr) => acc + curr.percentage, 0) || 0,
        [completeDistributions]
    );

    // Star breakdown calculation
    const totalPercentage = useMemo(() => percentageData.reduce((sum, percent) => sum + percent, 0), [percentageData]);
    const normalizedPercentages = useMemo(
        () => percentageData.map((p) => (totalPercentage > 0 ? (p / totalPercentage) * 100 : 0)),
        [percentageData, totalPercentage]
    );

    // Generate paths
    const generatePath = (data: number[], maxValue: number, smooth = false) => {
        if (!animate) return '';

        const scaledData = data.map((val) => (val / maxValue) * chartHeight);

        if (smooth) {
            let path = '';
            for (let i = 0; i < scaledData.length; i++) {
                const x = xPositions[i];
                const y = height - padding.bottom - scaledData[i];

                if (i === 0) {
                    path += `M${x},${y}`;
                } else {
                    const xPrev = xPositions[i - 1];
                    const yPrev = height - padding.bottom - scaledData[i - 1];

                    const controlX1 = xPrev + (x - xPrev) / 2;
                    const controlX2 = xPrev + (x - xPrev) / 2;

                    path += ` C${controlX1},${yPrev} ${controlX2},${y} ${x},${y}`;
                }
            }
            return path;
        } else {
            return scaledData
                .map((y, i) => {
                    const x = xPositions[i];
                    const scaledY = height - padding.bottom - y;
                    return i === 0 ? `M${x},${scaledY}` : `L${x},${scaledY}`;
                })
                .join(' ');
        }
    };

    const countPath = generatePath(countData, maxCount, true);
    const percentagePath = generatePath(percentageData, maxPercentage, true);

    // Add area under curves
    const createAreaPath = (linePath: string) => {
        return `${linePath} L${xPositions[xPositions.length - 1]},${height - padding.bottom} L${xPositions[0]},${height - padding.bottom} Z`;
    };

    const countAreaPath = createAreaPath(countPath);
    const percentageAreaPath = createAreaPath(percentagePath);

    // Points for the chart
    const countPoints = useMemo(
        () =>
            countData.map((count, i) => ({
                x: xPositions[i],
                y: height - padding.bottom - (animate ? (count / maxCount) * chartHeight : 0),
                value: count,
                label: 'Count',
                rating: i + 1,
            })),
        [countData, xPositions, animate, maxCount, height]
    );

    const percentagePoints = useMemo(
        () =>
            percentageData.map((percentage, i) => ({
                x: xPositions[i],
                y: height - padding.bottom - (animate ? (percentage / maxPercentage) * chartHeight : 0),
                value: percentage,
                label: 'Percentage',
                rating: i + 1,
            })),
        [percentageData, xPositions, animate, maxPercentage, height]
    );

    // Grid lines
    const gridLines = useMemo(
        () => ({
            horizontal: Array.from({ length: 5 }, (_, i) => ({
                y: padding.top + (i * chartHeight) / 4,
                opacity: animate ? 0.4 - i * 0.05 : 0,
            })),
            vertical: xPositions.map((x) => ({
                x,
                opacity: animate ? 0.3 : 0,
            })),
        }),
        [animate, chartHeight, xPositions]
    );

    // Adjust tooltip position to stay within bounds
    const adjustTooltipPosition = (x: number, y: number) => {
        const tooltipWidth = 180;
        const tooltipHeight = 150; // Approximate height of the tooltip
        let adjustedX = x - tooltipWidth / 2;
        let adjustedY = y - tooltipHeight - 10;

        // Ensure tooltip stays within chart bounds
        if (adjustedX < padding.left) adjustedX = padding.left;
        if (adjustedX + tooltipWidth > width - padding.right) adjustedX = width - padding.right - tooltipWidth;
        if (adjustedY < padding.top) adjustedY = y + 20; // Move below the point if too high

        return { left: adjustedX, top: adjustedY };
    };

    return (
        <GlassmorphicContainer ref={containerRef}>
            {/* Decorative background elements */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(108, 93, 211, 0.15) 0%, rgba(108, 93, 211, 0) 70%)',
                    top: -100,
                    right: -100,
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 67, 150, 0.15) 0%, rgba(255, 67, 150, 0) 70%)',
                    bottom: -50,
                    left: -50,
                    zIndex: 0,
                }}
            />

            {/* Header section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: colors.text.primary,
                            mb: 0.5,
                            letterSpacing: '-0.5px',
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Box component="span" sx={{ fontWeight: 'bold', color: colors.text.primary }}>
                            {totalRatings.toLocaleString()}
                        </Box>
                        total ratings •
                        <Box
                            component="span"
                            sx={{
                                fontWeight: 'bold',
                                color:
                                    ratingsAvg >= 4
                                        ? colors.success
                                        : ratingsAvg >= 3
                                            ? colors.warning
                                            : colors.secondary,
                            }}
                        >
                            {ratingsAvg.toFixed(1)}
                        </Box>
                        average
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <StyledChip
                        label="Count"
                        sx={{
                            backgroundColor: alpha(colors.primary, showCountLine ? 0.2 : 0.1),
                            color: colors.primary,
                            opacity: showCountLine ? 1 : 0.5,
                            '&::before': {
                                content: '""',
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: colors.primary,
                                marginRight: 1,
                            },
                        }}
                        onClick={() => setShowCountLine((prev) => !prev)}
                        aria-label="Toggle Count Line"
                    />
                    <StyledChip
                        label="Percentage"
                        sx={{
                            backgroundColor: alpha(colors.secondary, showPercentageLine ? 0.2 : 0.1),
                            color: colors.secondary,
                            opacity: showPercentageLine ? 1 : 0.5,
                            '&::before': {
                                content: '""',
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: colors.secondary,
                                marginRight: 1,
                            },
                        }}
                        onClick={() => setShowPercentageLine((prev) => !prev)}
                        aria-label="Toggle Percentage Line"
                    />
                </Box>
            </Box>

            {/* Chart container */}
            <Box
                sx={{
                    position: 'relative',
                    mb: 3,
                    zIndex: 1,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.02)',
                    },
                }}
            >
                <svg
                    ref={chartRef}
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ overflow: 'visible' }}
                    role="img"
                    aria-label="Rating Distribution Chart"
                >
                    {/* Definitions for gradients and filters */}
                    <defs>
                        <linearGradient id="countGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.7 }} />
                            <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 0 }} />
                        </linearGradient>

                        <linearGradient id="percentageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: colors.secondary, stopOpacity: 0.7 }} />
                            <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0 }} />
                        </linearGradient>

                        <filter id="glow1" height="300%" width="300%" x="-100%" y="-100%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        <filter id="glow2" height="300%" width="300%" x="-100%" y="-100%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        <filter id="neon">
                            <feFlood floodColor={colors.secondary} result="flood" />
                            <feComposite operator="in" in="flood" in2="SourceGraphic" result="mask" />
                            <feGaussianBlur in="mask" stdDeviation="1" result="blurred" />
                            <feComposite in="SourceGraphic" in2="blurred" operator="over" />
                        </filter>
                    </defs>

                    {/* Grid lines */}
                    {gridLines.horizontal.map((line, i) => (
                        <line
                            key={`h-line-${i}`}
                            x1={padding.left}
                            y1={line.y}
                            x2={width - padding.right}
                            y2={line.y}
                            stroke={colors.grid}
                            strokeWidth="1"
                            opacity={line.opacity}
                            strokeDasharray="4 4"
                            style={{ transition: 'opacity 1s ease' }}
                        />
                    ))}

                    {gridLines.vertical.map((line, i) => (
                        <line
                            key={`v-line-${i}`}
                            x1={line.x}
                            y1={padding.top}
                            x2={line.x}
                            y2={height - padding.bottom}
                            stroke={colors.grid}
                            strokeWidth="1"
                            opacity={line.opacity}
                            strokeDasharray="4 4"
                            style={{ transition: 'opacity 1s ease' }}
                        />
                    ))}

                    {/* Area fills with animated opacity */}
                    {showCountLine && (
                        <path
                            d={countAreaPath}
                            fill="url(#countGradient)"
                            opacity={animate ? 0.6 : 0}
                            style={{ transition: 'opacity 1.5s ease, d 1.5s ease' }}
                        />
                    )}
                    {showPercentageLine && (
                        <path
                            d={percentageAreaPath}
                            fill="url(#percentageGradient)"
                            opacity={animate ? 0.6 : 0}
                            style={{ transition: 'opacity 1.5s ease, d 1.5s ease' }}
                        />
                    )}

                    {/* Lines with drawing effect */}
                    {showCountLine && (
                        <path
                            d={countPath}
                            stroke={colors.primary}
                            strokeWidth="3"
                            fill="none"
                            filter="url(#glow1)"
                            strokeDasharray={animate ? 0 : 1000}
                            strokeDashoffset={animate ? 0 : 1000}
                            style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
                            opacity={animate ? 1 : 0}
                        />
                    )}

                    {showPercentageLine && (
                        <path
                            d={percentagePath}
                            stroke={colors.secondary}
                            strokeWidth="3"
                            fill="none"
                            filter="url(#glow1)"
                            strokeDasharray={animate ? 0 : 1000}
                            strokeDashoffset={animate ? 0 : 1000}
                            style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
                            opacity={animate ? 1 : 0}
                        />
                    )}

                    {/* Interactive points */}
                    {showCountLine &&
                        countPoints.map((point, i) => (
                            <g
                                key={`count-point-${i}`}
                                onMouseEnter={() => {
                                    setHoveredPoint(point);
                                    setHoveredRating(point.rating);
                                }}
                                onMouseLeave={() => {
                                    setHoveredPoint(null);
                                    setHoveredRating(null);
                                }}
                                style={{ cursor: 'pointer' }}
                                tabIndex={0}
                                onFocus={() => {
                                    setHoveredPoint(point);
                                    setHoveredRating(point.rating);
                                }}
                                onBlur={() => {
                                    setHoveredPoint(null);
                                    setHoveredRating(null);
                                }}
                                role="button"
                                aria-label={`Count for ${point.rating} stars: ${point.value}`}
                            >
                                {/* Ripple effect */}
                                {hoveredRating === point.rating && (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={0}
                                        fill="none"
                                        stroke={colors.primary}
                                        strokeWidth="1"
                                        style={{
                                            animation: 'ripple 1s ease-out',
                                        }}
                                    />
                                )}
                                {/* Outer glow circle */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={hoveredRating === point.rating ? 14 : 0}
                                    fill="none"
                                    stroke={colors.primary}
                                    strokeWidth="1"
                                    opacity={0.3}
                                    style={{
                                        transition: 'r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                                    }}
                                />
                                {/* Inner point */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={hoveredRating === point.rating ? 7 : 5}
                                    fill={colors.primary}
                                    filter="url(#glow2)"
                                    style={{
                                        transition: 'r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s ease',
                                        transform: animate ? 'scale(1)' : 'scale(0)',
                                        transformOrigin: `${point.x}px ${point.y}px`,
                                        animation: animate ? `pulse-${i + 1} 2s infinite ease-in-out` : 'none',
                                    }}
                                />
                            </g>
                        ))}

                    {showPercentageLine &&
                        percentagePoints.map((point, i) => (
                            <g
                                key={`percentage-point-${i}`}
                                onMouseEnter={() => {
                                    setHoveredPoint(point);
                                    setHoveredRating(point.rating);
                                }}
                                onMouseLeave={() => {
                                    setHoveredPoint(null);
                                    setHoveredRating(null);
                                }}
                                style={{ cursor: 'pointer' }}
                                tabIndex={0}
                                onFocus={() => {
                                    setHoveredPoint(point);
                                    setHoveredRating(point.rating);
                                }}
                                onBlur={() => {
                                    setHoveredPoint(null);
                                    setHoveredRating(null);
                                }}
                                role="button"
                                aria-label={`Percentage for ${point.rating} stars: ${point.value}%`}
                            >
                                {/* Ripple effect */}
                                {hoveredRating === point.rating && (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={0}
                                        fill="none"
                                        stroke={colors.secondary}
                                        strokeWidth="1"
                                        style={{
                                            animation: 'ripple 1s ease-out',
                                        }}
                                    />
                                )}
                                {/* Outer glow circle */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={hoveredRating === point.rating ? 14 : 0}
                                    fill="none"
                                    stroke={colors.secondary}
                                    strokeWidth="1"
                                    opacity={0.3}
                                    style={{
                                        transition: 'r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                                    }}
                                />
                                {/* Inner point */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={hoveredRating === point.rating ? 7 : 5}
                                    fill={colors.secondary}
                                    filter="url(#glow2)"
                                    style={{
                                        transition: 'r 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s ease',
                                        transformOrigin: `${point.x}px ${point.y}px`,
                                        animation: animate ? `pulse-${i + 6} 2s infinite ease-in-out` : 'none',
                                        transform: animate ? 'scale(1)' : 'scale(0)',
                                    }}
                                />
                            </g>
                        ))}

                    {/* X-axis labels with stars */}
                    {completeDistributions.map((dist, i) => (
                        <g
                            key={`x-label-${i}`}
                            onMouseEnter={() => setHoveredRating(dist.rating)}
                            onMouseLeave={() => setHoveredRating(null)}
                            style={{ cursor: 'pointer' }}
                            tabIndex={0}
                            onFocus={() => setHoveredRating(dist.rating)}
                            onBlur={() => setHoveredRating(null)}
                            role="button"
                            aria-label={`${dist.rating} stars`}
                        >
                            <text
                                x={xPositions[i]}
                                y={height - padding.bottom + 25}
                                textAnchor="middle"
                                fill={hoveredRating === dist.rating ? '#fff' : 'rgba(255, 255, 255, 0.7)'}
                                fontSize="14"
                                fontWeight={hoveredRating === dist.rating ? 'bold' : 'normal'}
                                style={{ transition: 'fill 0.3s ease, font-weight 0.3s ease' }}
                            >
                                {dist.rating}★
                            </text>
                            {hoveredRating === dist.rating && (
                                <circle
                                    cx={xPositions[i]}
                                    cy={height - padding.bottom + 4}
                                    r="3"
                                    fill="#fff"
                                />
                            )}
                        </g>
                    ))}
                </svg>

                {/* Enhanced tooltip with animation */}
                {hoveredPoint && (
                    <GlassTooltip
                        className="visible"
                        sx={adjustTooltipPosition(hoveredPoint.x, hoveredPoint.y)}
                    >
                        <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                            <RatingIndicator value={hoveredPoint.rating}>
                                {hoveredPoint.rating}★
                            </RatingIndicator>
                        </Box>

                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                color: 'rgba(255,255,255,0.7)',
                                mb: 1,
                            }}
                        >
                            Rating Statistics
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Count
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: colors.primary,
                                    }}
                                >
                                    {countData[hoveredPoint.rating - 1].toLocaleString()}
                                </Typography>
                            </Box>
                            <ProgressBar
                                value={(countData[hoveredPoint.rating - 1] / maxCount) * 100}
                                color={colors.primary}
                            />
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Percentage
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: colors.secondary,
                                    }}
                                >
                                    {percentageData[hoveredPoint.rating - 1].toFixed(1)}%
                                </Typography>
                            </Box>
                            <ProgressBar
                                value={normalizedPercentages[hoveredPoint.rating - 1]}
                                color={colors.secondary}
                            />
                        </Box>
                    </GlassTooltip>
                )}
            </Box>

            {/* Star breakdown section */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    maxHeight: 200,
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        mb: 2,
                        color: colors.text.secondary,
                        fontWeight: 'bold',
                    }}
                >
                    Rating Breakdown
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {completeDistributions.map((dist, i) => (
                        <Box
                            key={`breakdown-${i}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                transition: 'transform 0.5s ease, opacity 0.5s ease',
                                transform: animate ? 'translateX(0)' : 'translateX(-20px)',
                                opacity: animate ? 1 : 0,
                                transitionDelay: `${i * 0.1}s`,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 1,
                                },
                            }}
                            onMouseEnter={() => setHoveredRating(dist.rating)}
                            onMouseLeave={() => setHoveredRating(null)}
                            tabIndex={0}
                            onFocus={() => setHoveredRating(dist.rating)}
                            onBlur={() => setHoveredRating(null)}
                            role="button"
                            aria-label={`${dist.rating} stars: ${dist.percentage.toFixed(1)}%, ${dist.count} votes`}
                        >
                            <Typography
                                sx={{
                                    width: 40,
                                    fontWeight: 'bold',
                                    color: hoveredRating === dist.rating ? '#fff' : colors.text.secondary,
                                }}
                            >
                                {dist.rating}★
                            </Typography>

                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <Box
                                    sx={{
                                        height: 8,
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: '100%',
                                            width: `${normalizedPercentages[i]}%`,
                                            background: `linear-gradient(90deg, ${dist.rating >= 4
                                                ? colors.success
                                                : dist.rating >= 3
                                                    ? colors.warning
                                                    : colors.secondary
                                                }, ${alpha(
                                                    dist.rating >= 4
                                                        ? colors.success
                                                        : dist.rating >= 3
                                                            ? colors.warning
                                                            : colors.secondary,
                                                    0.7
                                                )})`,
                                            borderRadius: 4,
                                            transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            boxShadow: hoveredRating === dist.rating
                                                ? `0 0 10px ${dist.rating >= 4
                                                    ? colors.success
                                                    : dist.rating >= 3
                                                        ? colors.warning
                                                        : colors.secondary
                                                }`
                                                : 'none',
                                            opacity: animate ? 1 : 0,
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Typography
                                sx={{
                                    width: 50,
                                    textAlign: 'right',
                                    fontWeight: hoveredRating === dist.rating ? 'bold' : 'normal',
                                    color: hoveredRating === dist.rating ? '#fff' : colors.text.secondary,
                                }}
                            >
                                {dist.percentage.toFixed(1)}%
                            </Typography>

                            <Typography
                                sx={{
                                    width: 70,
                                    textAlign: 'right',
                                    fontWeight: hoveredRating === dist.rating ? 'bold' : 'normal',
                                    color: hoveredRating === dist.rating ? '#fff' : colors.text.secondary,
                                }}
                            >
                                {dist.count.toLocaleString()}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Summary section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        width: '48%',
                        transform: animate ? 'translateY(0)' : 'translateY(20px)',
                        opacity: animate ? 1 : 0,
                        transition: 'transform 0.5s ease, opacity 0.5s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>
                        Average Rating
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 'bold',
                            color:
                                ratingsAvg >= 4
                                    ? colors.success
                                    : ratingsAvg >= 3
                                        ? colors.warning
                                        : colors.secondary,
                        }}
                    >
                        {ratingsAvg.toFixed(1)}
                        <Typography component="span" variant="h6" sx={{ color: colors.text.secondary, ml: 0.5 }}>
                            / 5
                        </Typography>
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        width: '48%',
                        transform: animate ? 'translateY(0)' : 'translateY(20px)',
                        opacity: animate ? 1 : 0,
                        transition: 'transform 0.5s ease, opacity 0.5s ease',
                        transitionDelay: '0.1s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>
                        Trend (5★ vs 1★)
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 'bold',
                            color: countTrend >= 0 ? colors.success : colors.secondary,
                        }}
                    >
                        {countTrend > 0 ? '+' : ''}{countTrend.toFixed(1)}%
                    </Typography>
                </Box>
            </Box>
        </GlassmorphicContainer>
    );
};

// Define keyframes for animations
const keyframes = `
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes ripple {
            0% { r: 0; opacity: 0.5; }
            100% { r: 20; opacity: 0; }
        }

        ${Array.from({ length: 10 }, (_, i) => `
            @keyframes pulse-${i + 1} {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `).join('')}
    `;

// Inject keyframes into the document
const styleSheet = document.createElement('style');
styleSheet.innerHTML = keyframes;
document.head.appendChild(styleSheet);

export default RatingsDistribution;