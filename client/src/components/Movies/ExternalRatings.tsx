import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Tooltip,
    Divider,
    useTheme,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import MovieReviews from '../Reviews/MovieReviews';

export interface ExternalRating {
    source: string;
    value: string;
    score?: number; // Normalized score out of 5
    logo?: string;
}

interface ExternalRatingsProps {
    ratings: ExternalRating[];
    movieId: string;
}

// Background animations (unchanged)
const wave = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const float = keyframes`
    0% { transform: translate(0, 0); opacity: 0.3; }
    50% { transform: translate(20px, -20px); opacity: 0.6; }
    100% { transform: translate(40px, 0); opacity: 0.3; }
`;

const pulse = keyframes`
    0% { transform:  opacity: 0.5; }
    50% { transform:  opacity: 0.8; }
    100% { transform:  opacity: 0.5; }
`;

const fadeIn = keyframes`
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
`;

// Container with dark background and animations (unchanged)
const Container = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
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
        background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1), rgba(255, 215, 0, 0.1))',
        backgroundSize: '200% 200%',
        zIndex: -1,
        animation: `${wave} 15s ease-in-out infinite`,
    },
    transition: 'transform 0.3s ease',
    '&:hover': {
        // transform: 'scale(1.01)',
    },
}));

// Rating item (unchanged)
const RatingItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 4px 15px rgba(70, 130, 180, 0.2)',
    },
}));

// Rating logo (unchanged)
const RatingLogo = styled('img')(({ theme }) => ({
    width: 36,
    height: 36,
    objectFit: 'contain',
    marginRight: theme.spacing(2),
    borderRadius: 8,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
    },
}));

// Rating score (unchanged)
const RatingScore = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
    color: '#fff',
    transition: 'text-shadow 0.3s ease',
    '&:hover': {
        textShadow: '0 0 10px rgba(70, 130, 180, 0.8), 0 0 20px rgba(70, 130, 180, 0.5)',
    },
}));

// Tooltip (unchanged)
const MinimalTooltip = styled(Box)(({ theme }) => ({
    position: 'absolute',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    color: '#fff',
    padding: theme.spacing(1.5),
    borderRadius: 8,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    fontSize: '0.85rem',
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    opacity: 0,
    transform: 'translateY(10px)',
    '&.visible': {
        opacity: 1,
        transform: 'translateY(0)',
    },
    width: 200,
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '6px 6px 0 6px',
        borderStyle: 'solid',
        borderColor: 'rgba(255, 255, 255, 0.1) transparent transparent transparent',
    },
}));

// Average score indicator (unchanged)
const pulseAnimation = keyframes`
    0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
    100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
`;

const RatingIndicator = styled(Box)<{ value: number }>(({ theme, value }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: 60,
    height: 60,
    background: `conic-gradient(from 0deg, #FFD700 0%, #FFD700 ${value}%, rgba(255, 255, 255, 0.1) ${value}%, rgba(255, 255, 255, 0.1) 100%)`,
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.5)',
    animation: `${pulseAnimation} 2s infinite ease-in-out`,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
    },
}));

// Progress bar (unchanged)
const ProgressBar = styled(Box)<{ value: number; color: string }>(({ theme, value, color }) => ({
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        height: '100%',
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
        borderRadius: 4,
        left: 0,
        top: 0,
        transition: 'width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: `0 0 10px ${color}50`,
    },
}));

// Sentiment badge (unchanged)
const bounce = keyframes`
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); }
`;

const SentimentBadge = styled(Box)<{ sentiment: string }>(({ theme, sentiment }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0.5, 2),
    borderRadius: 16,
    backgroundColor:
        sentiment === 'Highly Positive'
            ? 'rgba(127, 186, 122, 0.2)'
            : sentiment === 'Mixed'
                ? 'rgba(255, 206, 115, 0.2)'
                : 'rgba(255, 67, 150, 0.2)',
    color:
        sentiment === 'Highly Positive'
            ? '#7FBA7A'
            : sentiment === 'Mixed'
                ? '#FFCE73'
                : '#FF4396',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    animation: `${bounce} 0.8s ease`,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

// Insights Card (unchanged)
const InsightsCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.15), rgba(255, 215, 0, 0.15))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    boxShadow: '0 4px 15px rgba(70, 130, 180, 0.2)',
    zIndex: 1,
    animation: `${fadeIn} 0.8s ease-in-out`,
    '&:hover': {
        boxShadow: '0 6px 20px rgba(70, 130, 180, 0.3)',
    },
}));

// Mini progress bar for score range (unchanged)
const RangeBar = styled(Box)<{ value: number }>(({ theme, value }) => ({
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        height: '100%',
        width: `${value}%`,
        background: 'linear-gradient(90deg, #4682B4, #FFD700)',
        borderRadius: 3,
        left: 0,
        top: 0,
        transition: 'width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: '0 0 8px rgba(70, 130, 180, 0.5)',
    },
}));

const ratingLogos: { [key: string]: string } = {
    IMDb: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg',
    TMDb: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef4b7d7e580b5c5f619b8c6f3d6f87c2c6e1e6a3d6e.svg',
    'Rotten Tomatoes': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg',
    Metacritic: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Metacritic_logo.svg/1200px-Metacritic_logo.svg.png',
};
const ExternalRatings: React.FC<ExternalRatingsProps> = ({ ratings, movieId }) => {
    const theme = useTheme();
    const [animate, setAnimate] = useState(false);

    // Color scheme (unchanged)
    const colors = {
        primary: '#4682B4',
        secondary: '#FFD700',
        accent: '#4FD8DE',
        success: '#7FBA7A',
        warning: '#FFCE73',
        background: {
            dark: '#1A1A1A',
            light: '#ffffff',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
        grid: 'rgba(255, 255, 255, 0.07)',
    };

    // Animation timing (unchanged)
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const normalizedRatings = ratings.map((rating) => ({
        ...rating,
        score: rating.score !== undefined && !isNaN(rating.score) ? rating.score * 20 : 0, // Convert 0-5 to 0-100
    }));

    const validScores = normalizedRatings
        .filter((rating) => rating.score !== undefined && !isNaN(rating.score))
        .map((rating) => rating.score!);
    const averageScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : 0;

    // Determine sentiment (unchanged)
    const sentiment =
        averageScore >= 70 ? 'Highly Positive' : averageScore >= 40 ? 'Mixed' : 'Critical';

    // Calculate insights for the Summary Insights Card (unchanged)
    const highestRated = normalizedRatings.reduce((max, rating) => (rating.score || 0) > (max.score || 0) ? rating : max, normalizedRatings[0]);
    const lowestRated = normalizedRatings.reduce((min, rating) => (rating.score || 0) < (min.score || 0) ? rating : min, normalizedRatings[0]);
    const scoreRange = (highestRated.score || 0) - (lowestRated.score || 0);
    const rangeInterpretation =
        scoreRange >= 50 ? 'Highly varied opinions' :
            scoreRange >= 20 ? 'Moderately varied opinions' :
                'Consistent ratings';

    // Convert averageScore to 0-5 scale for display (optional)
    const overallRatingOutOf5 = (averageScore / 20).toFixed(1); // Convert 0-100 back to 0-5

    if (!ratings || ratings.length === 0) {
        return (
            <Container>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: colors.text.primary, fontFamily: 'Roboto, sans-serif' }}
                >
                    Ratings & Reviews
                </Typography>
                <Typography
                    variant="body1"
                    sx={{ color: colors.text.secondary, fontFamily: 'Roboto, sans-serif' }}
                >
                    No external ratings available.
                </Typography>
            </Container>
        );
    }

    return (
        <Container>
            {/* Background animations (unchanged) */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(70, 130, 180, 0.1) 0%, rgba(70, 130, 180, 0) 70%)',
                    top: -50,
                    right: -50,
                    zIndex: 0,
                    animation: `${pulse} 5s infinite ease-in-out`,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0) 70%)',
                    bottom: -30,
                    left: -30,
                    zIndex: 0,
                    animation: `${pulse} 4s infinite ease-in-out`,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    top: '15%',
                    left: '10%',
                    animation: `${float} 6s infinite ease-in-out`,
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'rgba(255, 215, 0, 0.3)',
                    top: '70%',
                    right: '10%',
                    animation: `${float} 5s infinite ease-in-out`,
                    animationDelay: '1s',
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'rgba(70, 130, 180, 0.3)',
                    top: '40%',
                    left: '60%',
                    animation: `${float} 7s infinite ease-in-out`,
                    animationDelay: '2s',
                    zIndex: 0,
                }}
            />

            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    color: colors.text.primary,
                    fontWeight: 500,
                    fontFamily: 'Roboto, sans-serif',
                    zIndex: 1,
                    position: 'relative',
                }}
            >
                Ratings & Reviews
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, zIndex: 1, position: 'relative' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                    <RatingIndicator value={averageScore}>
                        {averageScore}
                    </RatingIndicator>
                </Box>
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 'bold',
                            color: colors.text.primary,
                            fontFamily: 'Roboto, sans-serif',
                        }}
                    >
                        Average Score
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            fontFamily: 'Roboto, sans-serif',
                        }}
                    >
                        Based on {normalizedRatings.length} external source{normalizedRatings.length !== 1 ? 's' : ''}
                    </Typography>
                    <SentimentBadge sentiment={sentiment} sx={{ mt: 1 }}>
                        {sentiment}
                    </SentimentBadge>
                </Box>
            </Box>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)', zIndex: 1, position: 'relative' }} />
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {normalizedRatings.map((rating, index) => {
                    const color =
                        (rating.score || 0) >= 70
                            ? colors.success
                            : (rating.score || 0) >= 40
                                ? colors.warning
                                : colors.secondary;

                    return (
                        <Grid item xs={12} key={index}>
                            <RatingItem
                                sx={{
                                    opacity: animate ? 1 : 0,
                                    transition: 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease',
                                    transitionDelay: `${index * 0.1}s`,
                                }}
                            >
                                {rating.logo ? (
                                    <RatingLogo src={rating.logo} alt={rating.source} />
                                ) : (
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: colors.text.primary,
                                        }}
                                    >
                                        <Typography variant="subtitle2">{rating.source.charAt(0)}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: colors.text.primary,
                                                fontFamily: 'Roboto, sans-serif',
                                            }}
                                        >
                                            {rating.source}
                                        </Typography>
                                        <Tooltip
                                            title={
                                                <MinimalTooltip className="visible">
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: colors.text.primary, fontFamily: 'Roboto, sans-serif' }}
                                                    >
                                                        {rating.source} Score
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{ color: color, fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}
                                                    >
                                                        {rating.value}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: colors.text.secondary, fontFamily: 'Roboto, sans-serif' }}
                                                    >
                                                        Normalized: {(rating.score || 0).toFixed(1)}/100
                                                    </Typography>
                                                </MinimalTooltip>
                                            }
                                            placement="top"
                                            arrow
                                        >
                                            <RatingScore variant="body2">{rating.value}</RatingScore>
                                        </Tooltip>
                                    </Box>
                                    <ProgressBar value={rating.score || 0} color={color} />
                                </Box>
                            </RatingItem>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Enhanced Insights Card with Overall Rating */}
            <InsightsCard>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: colors.text.primary,
                        fontFamily: 'Roboto, sans-serif',
                        mb: 1.5,
                    }}
                >
                    Insights
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7FBA7A, #4682B4)',
                            mr: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#fff',
                        }}
                    >
                        ↑
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            fontFamily: 'Roboto, sans-serif',
                        }}
                    >
                        Highest: {highestRated.source} ({highestRated.value})
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF4396, #FFD700)',
                            mr: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#fff',
                        }}
                    >
                        ↓
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            fontFamily: 'Roboto, sans-serif',
                        }}
                    >
                        Lowest: {lowestRated.source} ({lowestRated.value})
                    </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.primary,
                            fontFamily: 'Roboto, sans-serif',
                            mb: 0.5,
                        }}
                    >
                        Score Range: {scoreRange.toFixed(1)}/100
                    </Typography>
                    <RangeBar value={(scoreRange / 100) * 100} />
                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: colors.text.secondary,
                        fontFamily: 'Roboto, sans-serif',
                        fontStyle: 'italic',
                    }}
                >
                    {rangeInterpretation}
                </Typography>

                {/* Overall Rating Section */}
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: colors.text.primary,
                        fontFamily: 'Roboto, sans-serif',
                        mb: 1.5,
                    }}
                >
                    Overall Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                        <RatingIndicator value={averageScore}>
                            {overallRatingOutOf5}
                        </RatingIndicator>
                    </Box>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: colors.text.primary,
                                fontFamily: 'Roboto, sans-serif',
                            }}
                        >
                            {averageScore}/100 ({overallRatingOutOf5}/5)
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: colors.text.secondary,
                                fontFamily: 'Roboto, sans-serif',
                            }}
                        >
                            Aggregated from {normalizedRatings.length} sources
                        </Typography>
                        <SentimentBadge sentiment={sentiment} sx={{ mt: 1 }}>
                            {sentiment}
                        </SentimentBadge>
                    </Box>
                </Box>
            </InsightsCard>

        </Container>
    );
};

// Define keyframes for animations (unchanged)
const keyframesStyles = `
    @keyframes wave {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    @keyframes float {
        0% { transform: translate(0, 0); opacity: 0.3; }
        50% { transform: translate(20px, -20px); opacity: 0.6; }
        100% { transform: translate(40px, 0); opacity: 0.3; }
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 0.5; }
    }

    @keyframes bounce {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); }
    }

    @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
`;

// Inject keyframes into the document (unchanged)
const styleSheet = document.createElement('style');
styleSheet.innerHTML = keyframesStyles;
document.head.appendChild(styleSheet);

export default ExternalRatings;