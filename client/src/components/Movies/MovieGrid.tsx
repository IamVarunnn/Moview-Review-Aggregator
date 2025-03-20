import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Box,
    Typography,
    Rating,
    Chip,
    Skeleton,
    useTheme,
    alpha,
    styled,
    useMediaQuery,
} from '@mui/material';
import { MediaItem } from '../../types';
import { getImageUrl, formatDate } from '../../utils/helpers';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const MovieCard = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    height: '100%',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    '&:hover': {
        transform: 'translateY(-12px) scale(1.02)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
        '& .movie-overlay': {
            opacity: 1,
            transform: 'translateY(0)',
        },
        '& .movie-poster': {
            transform: 'scale(1.08)',
        },
        '& .rating-badge': {
            transform: 'scale(1.1)',
        },
    },
}));

const MoviePoster = styled('img')(({ theme }) => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease-out',
}));

const MovieOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(2),
    background: `linear-gradient(to top, 
      ${alpha(theme.palette.background.default, 0.95)} 0%, 
      ${alpha(theme.palette.background.default, 0.8)} 40%, 
      ${alpha(theme.palette.background.default, 0.4)} 70%, 
      transparent 100%)`,
    opacity: 0.9,
    transform: 'translateY(10px)',
    transition: 'all 0.4s ease',
}));

const GenreChip = styled(Chip)(({ theme }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: alpha(theme.palette.primary.main, 0.8),
    color: theme.palette.primary.contrastText,
    fontSize: '0.7rem',
    height: 24,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: theme.palette.primary.main,
        transform: 'scale(1.05)',
    },
}));

const RatingBadge = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: alpha(theme.palette.secondary.main, 0.9),
    color: theme.palette.secondary.contrastText,
    borderRadius: '50%',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 2,
    transition: 'all 0.3s ease',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    position: 'relative',
    display: 'inline-block',
    marginBottom: theme.spacing(4),
    fontWeight: 800,
    '&:after': {
        content: '""',
        position: 'absolute',
        bottom: -8,
        left: 0,
        width: '40%',
        height: 4,
        backgroundColor: theme.palette.primary.main,
        borderRadius: 2,
    },
}));

interface MovieGridProps {
    movies: MediaItem[];
    title?: string;
    loading?: boolean;
    genreMap?: Record<number, string>;
    mediaType?: 'movie' | 'tv';
}

const MovieGrid: React.FC<MovieGridProps> = ({
    movies,
    title,
    loading = false,
    genreMap = {},
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const navigate = useNavigate();

    const handleMediaClick = (mediaId: number, mediaType?: 'movie' | 'tv', hasFirstAirDate: boolean = false, hasName: boolean = false) => {
        // Infer media type if not provided: TV shows typically have first_air_date or name
        const inferredType = mediaType || (hasFirstAirDate || hasName ? 'tv' : 'movie');
        console.log(`Navigating to /details/${inferredType}/${mediaId}`);
        navigate(`/details/${inferredType}/${mediaId}`);
    };

    const renderSkeleton = () => {
        return Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={6} sm={4} md={3} lg={3} key={`skeleton-${index}`}>
                <Box sx={{
                    height: { xs: 220, sm: 320, md: 380 },
                    borderRadius: theme.shape.borderRadius * 2,
                    overflow: 'hidden',
                }}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        animation="wave"
                        sx={{
                            borderRadius: theme.shape.borderRadius * 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                    />
                </Box>
            </Grid>
        ));
    };

    const renderMovies = () => {
        return movies.map((movie) => {
            const posterUrl = movie.poster_path
                ? getImageUrl(movie.poster_path, 'w500')
                : 'path/to/fallback/image.jpg';
            const rating = (movie.vote_average || 0) / 2;
            const isHovered = hoveredId === movie.id;

            // Get genre names from IDs using the genreMap
            const genreNames = movie.genre_ids
                ? movie.genre_ids.slice(0, 3).map((id: number) => genreMap[id] || '')
                : [];

            // Use media_type to determine display properties, with fallback
            const isTv = movie.media_type === 'tv' || (!movie.media_type && (!!movie.first_air_date || !!movie.name));
            const displayTitle = isTv ? movie.name || movie.title || 'Unknown' : movie.title || movie.name || 'Unknown';
            const displayDate = isTv ? movie.first_air_date || movie.release_date || '' : movie.release_date || movie.first_air_date || '';

            // Log the item to debug media_type and other fields
            console.log('MovieGrid item:', {
                id: movie.id,
                title: displayTitle,
                media_type: movie.media_type,
                first_air_date: movie.first_air_date,
                name: movie.name,
                title_field: movie.title,
            });

            return (
                <Grid item xs={6} sm={4} md={3} lg={3} key={`${movie.media_type || 'unknown'}-${movie.id}`}>
                    <MovieCard
                        onClick={() => handleMediaClick(movie.id, movie.media_type, !!movie.first_air_date, !!movie.name)}
                        onMouseEnter={() => setHoveredId(movie.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        sx={{
                            transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'none',
                        }}
                    >
                        <Box sx={{ height: { xs: 220, sm: 320, md: 380 } }}>
                            <MoviePoster
                                src={posterUrl}
                                alt={displayTitle}
                                className="movie-poster"
                                loading="lazy"
                            />
                            <RatingBadge
                                className="rating-badge"
                                aria-label={`Rating: ${(movie.vote_average || 0).toFixed(1)}`}
                            >
                                {(movie.vote_average || 0).toFixed(1)}
                            </RatingBadge>
                        </Box>
                        <MovieOverlay className="movie-overlay" sx={{
                            transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                            opacity: isHovered ? 1 : 0.9,
                        }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                noWrap
                                sx={{
                                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                                    transition: 'all 0.3s ease',
                                    color: theme.palette.text.primary,
                                }}
                            >
                                {displayTitle}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 1 }}>
                                <Rating
                                    value={rating}
                                    precision={0.5}
                                    readOnly
                                    size="small"
                                    sx={{ mr: 1 }}
                                    icon={<StarIcon fontSize="inherit" sx={{ color: theme.palette.secondary.main }} />}
                                    emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.5 }} />}
                                />
                            </Box>

                            {displayDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CalendarTodayIcon sx={{ fontSize: '0.8rem', mr: 0.5, color: theme.palette.text.secondary }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(displayDate)}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5, mx: -0.5 }}>
                                {genreNames.filter(Boolean).map((genre: string, index: number) => (
                                    <GenreChip
                                        key={index}
                                        label={genre}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </MovieOverlay>
                    </MovieCard>
                </Grid>
            );
        });
    };

    if (!loading && movies.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    No movies or TV shows found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 6, mt: 2 }}>
            {title && (
                <SectionTitle
                    variant="h5"
                    gutterBottom
                >
                    {title}
                </SectionTitle>
            )}

            <Grid container spacing={3}>
                {loading ? renderSkeleton() : renderMovies()}
            </Grid>
        </Box>
    );
};

export default MovieGrid;