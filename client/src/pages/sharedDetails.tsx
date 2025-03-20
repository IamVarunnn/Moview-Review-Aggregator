import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    Chip,
    Rating,
    Button,
    CircularProgress,
    Divider,
    Paper,
    alpha,
    useTheme,
    Dialog,
    DialogContent,
    IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PlayArrow, Close, BookmarkAdd as BookmarkAddIcon } from '@mui/icons-material';
import { MediaItem, Review, Genre, Movie, TVShow, Cast, ExternalRating, RatingDistribution } from '../types';
import {
    getMovieDetails,
    getTVShowDetails,
    getMovieReviews,
    getTVShowReviews,
    getMovieCredits,
    getTVShowCredits,
    getMovieExternalRatings,
    getTVShowExternalRatings,
    getMovieVideos,
    getTVShowVideos,
} from '../services/sharedServices';
import ReviewForm from '../components/Reviews/ReviewForm';
import ReviewList from '../components/Reviews/ReviewList';
import CastList from '../components/Movies/CastList';
import ExternalRatings from '../components/Movies/ExternalRatings';
import RatingsDistribution from '../components/Movies/RatingsDistribution';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import MovieReviews from '../components/Reviews/MovieReviews';

// Backend API functions
const updateReview = async (reviewId: string, updatedReview: Review, token: string | null) => {
    try {
        const authToken = token || localStorage.getItem('token');
        const response = await axios.put(`/api/reviews/${reviewId}`, updatedReview, {
            headers: {
                Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
        });
        return response.data;
    } catch (err) {
        console.error('Error updating review:', err);
        throw new Error('Failed to update review');
    }
};

const deleteReview = async (reviewId: string, token: string | null) => {
    try {
        const authToken = token || localStorage.getItem('token');
        await axios.delete(`/api/reviews/${reviewId}`, {
            headers: {
                Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
        });
    } catch (err) {
        console.error('Error deleting review:', err);
        throw new Error('Failed to delete review');
    }
};

// // Function to add to watchlist
// const addToWatchlist = async (
//     mediaId: number,
//     mediaType: 'movie' | 'tv',
//     token: string | null,
//     title?: string,
//     poster_path?: string
// ) => {
//     const authToken = token || localStorage.getItem('token');
//     try {
//         console.log('Using authToken for watchlist:', authToken); // Log the token being used
//         if (!authToken) {
//             throw new Error('No authentication token available. Please log in.');
//         }

//         const response = await axios.post(
//             '/api/watchlist',
//             { mediaId, mediaType, title, poster_path },
//             {
//                 headers: {
//                     Authorization: `Bearer ${authToken}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (err) {
//         if (axios.isAxiosError(err)) {
//             const errorMessage = err.response?.data?.message || `Failed to add to watchlist: ${err.message}`;
//             console.error('Axios error in addToWatchlist:', {
//                 message: err.message,
//                 status: err.response?.status,
//                 data: err.response?.data,
//                 token: authToken, // Log the token for debugging
//             });
//             throw new Error(errorMessage);
//         } else {
//             console.error('Error in addToWatchlist (General):', {
//                 message: err instanceof Error ? err.message : String(err),
//                 stack: err instanceof Error ? err.stack : undefined,
//             });
//             throw new Error('Failed to add to watchlist: Unexpected error');
//         }
//     }
// };

// // Function to remove from watchlist
// const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv', token: string | null) => {
//     try {
//         const authToken = token || localStorage.getItem('token');
//         const response = await axios.delete(`/api/watchlist/${mediaId}?mediaType=${mediaType}`, {
//             headers: {
//                 Authorization: authToken ? `Bearer ${authToken}` : undefined,
//             },
//         });
//         return response.data;
//     } catch (err) {
//         console.error('Error removing from watchlist:', err);
//         throw new Error('Failed to remove from watchlist');
//     }
// };

// Styled components
const BackdropContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    height: '70vh',
    minHeight: 500,
    maxHeight: 800,
    width: '100%',
    marginBottom: theme.spacing(6),
    [theme.breakpoints.down('md')]: {
        height: '50vh',
        minHeight: 350,
    },
}));

const BackdropOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to right, ${alpha(
        theme.palette.background.default,
        0.9
    )} 0%, ${alpha(theme.palette.background.default, 0.6)} 50%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
    display: 'flex',
    alignItems: 'center',
}));

const PosterImage = styled('img')(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    boxShadow: theme.shadows[8],
    height: '100%',
    width: '100%',
    maxWidth: 300,
    [theme.breakpoints.down('md')]: {
        maxWidth: 200,
    },
    display: 'block',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    marginBottom: theme.spacing(3),
    position: 'relative',
    paddingLeft: theme.spacing(2),
    '&:before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: theme.palette.primary.main,
        borderRadius: theme.shape.borderRadius,
    },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
}));

interface ExtendedMediaItem extends MediaItem {
    number_of_seasons?: number;
    number_of_episodes?: number;
    media_type: 'movie' | 'tv';
}

const DetailsPage: React.FC = () => {
    const { mediaType = 'movie', id } = useParams<{ mediaType: 'movie' | 'tv'; id: string }>();
    const [mediaItem, setMediaItem] = useState<ExtendedMediaItem | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [cast, setCast] = useState<Cast[]>([]);
    const [externalRatings, setExternalRatings] = useState<ExternalRating[]>([]);
    const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
    const [totalRatings, setTotalRatings] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [ratingDistributionLoading, setRatingDistributionLoading] = useState<boolean>(true);
    const { state } = useAuth();
    const { isAuthenticated, authToken } = state;
    const theme = useTheme();

    // State for trailer dialog
    const [trailerOpen, setTrailerOpen] = useState(false);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [isAddedToWatchlist, setIsAddedToWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState<boolean>(true);

    const validMediaType: 'movie' | 'tv' = mediaType === 'tv' ? 'tv' : 'movie';

    // Fetch watchlist status when component mounts or auth/media state changes
    useEffect(() => {
    }, [isAuthenticated, authToken, mediaItem]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                setRatingDistributionLoading(true);

                if (!id || !mediaType) {
                    throw new Error('Missing media ID or type');
                }

                if (mediaType !== 'movie' && mediaType !== 'tv') {
                    throw new Error('Invalid media type');
                }

                let detailsResponse: Movie | TVShow | null;
                let reviewsResponse;
                let creditsResponse;
                let externalRatingsData;
                let videoData;

                try {
                    if (mediaType === 'tv') {
                        const [details, reviews, credits, videos] = await Promise.all([
                            getTVShowDetails(id),
                            getTVShowReviews(id),
                            getTVShowCredits(id),
                            getTVShowVideos(Number(id)),
                        ]);
                        if (!details) throw new Error('Failed to fetch TV show details');
                        detailsResponse = details;
                        reviewsResponse = reviews;
                        creditsResponse = credits;
                        videoData = videos;
                        externalRatingsData = getTVShowExternalRatings(detailsResponse as TVShow);
                    } else {
                        const [details, reviews, credits, videos] = await Promise.all([
                            getMovieDetails(id),
                            getMovieReviews(id),
                            getMovieCredits(id),
                            getMovieVideos(Number(id)),
                        ]);
                        detailsResponse = details;
                        reviewsResponse = reviews;
                        creditsResponse = credits;
                        videoData = videos;
                        externalRatingsData = getMovieExternalRatings(detailsResponse as Movie);
                    }

                    setCast(creditsResponse?.cast || []);
                    setExternalRatings(externalRatingsData || []);

                    if (!detailsResponse) {
                        throw new Error('No details found for this media item');
                    }

                    const mappedMediaItem: ExtendedMediaItem = {
                        id: detailsResponse.id,
                        title: mediaType === 'tv' ? (detailsResponse as TVShow).name : (detailsResponse as Movie).title,
                        overview: detailsResponse.overview || 'No description available',
                        poster_path: detailsResponse.poster_path || '',
                        backdrop_path: detailsResponse.backdrop_path || '',
                        release_date:
                            mediaType === 'tv'
                                ? (detailsResponse as TVShow).first_air_date || ''
                                : (detailsResponse as Movie).release_date || '',
                        vote_average: detailsResponse.vote_average || 0,
                        vote_count: detailsResponse.vote_count || 0,
                        genres: detailsResponse.genres || [],
                        genre_ids: detailsResponse.genres?.map((g: Genre) => g.id) || [],
                        media_type: validMediaType,
                        videos: videoData ? { results: videoData.results || [] } : undefined,
                    };

                    if (mediaType === 'tv') {
                        const tvShow = detailsResponse as TVShow;
                        mappedMediaItem.number_of_seasons = tvShow.number_of_seasons;
                        mappedMediaItem.number_of_episodes = tvShow.number_of_episodes;
                    }

                    setMediaItem(mappedMediaItem);
                    setReviews(reviewsResponse?.reviews || []);

                    // Mock data for rating distribution
                    const mockRatingDistribution: RatingDistribution[] = [
                        { rating: 5, count: 8399, percentage: 55 },
                        { rating: 4, count: 4581, percentage: 30 },
                        { rating: 3, count: 1527, percentage: 10 },
                        { rating: 2, count: 458, percentage: 3 },
                        { rating: 1, count: 305, percentage: 2 },
                    ];
                    const mockTotalRatings = 15270;
                    setRatingDistribution(mockRatingDistribution);
                    setTotalRatings(mockTotalRatings);
                } catch (mainError) {
                    console.error('Error fetching main data:', mainError);
                    throw mainError instanceof Error ? mainError : new Error('Failed to fetch media details');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                console.error('Error in fetchData:', err);
                setMediaItem(null);
            } finally {
                setLoading(false);
                setRatingDistributionLoading(false);
            }
        };

        fetchData();
    }, [id, mediaType]);

    const handleWatchTrailer = () => {
        if (!mediaItem) return;

        if (mediaItem?.videos?.results && Array.isArray(mediaItem.videos.results)) {
            const trailer =
                mediaItem.videos.results.find(
                    (video) => video.type === 'Trailer' && video.site === 'YouTube' && video.official
                ) ||
                mediaItem.videos.results.find((video) => video.type === 'Trailer' && video.site === 'YouTube') ||
                mediaItem.videos.results.find((video) => video.site === 'YouTube');

            if (trailer?.key) {
                setTrailerKey(trailer.key);
                setTrailerOpen(true);
                return;
            }
        }

        alert('No trailer available for this item.');
    };

    const getTrailerUrl = () => {
        if (!trailerKey) return '';
        return `https://www.youtube.com/embed/${trailerKey}?autoplay=1&origin=${window.location.origin}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&controls=1`;
    };

    const handleCloseTrailer = () => {
        setTrailerOpen(false);
        setTrailerKey(null);
    };

    // const handleAddToWatchlist = async () => {
    //     if (!mediaItem || !state.isAuthenticated) {
    //         alert('Please log in to add to your watchlist.');
    //         return;
    //     }

    //     setWatchlistLoading(true);
    //     console.log('Before adding to watchlist:', {
    //         isAddedToWatchlist,
    //         mediaItem,
    //         authToken: state.authToken,
    //     });
    //     try {
    //         await addToWatchlist(
    //             mediaItem.id,
    //             mediaItem.media_type,
    //             state.authToken,
    //             mediaItem.title,
    //             mediaItem.poster_path
    //         );
    //         setIsAddedToWatchlist(true);
    //         console.log('After adding to watchlist:', { isAddedToWatchlist: true });
    //         console.log(`${mediaItem.title} has been added to your watchlist!`);
    //     } catch (err) {
    //         const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    //         if (axios.isAxiosError(err)) {
    //             console.error('Error in handleAddToWatchlist (Axios):', {
    //                 message: err.message,
    //                 status: err.response?.status,
    //                 data: err.response?.data,
    //                 token: state.authToken,
    //             });
    //         } else {
    //             console.error('Error in handleAddToWatchlist (General):', {
    //                 message: errorMessage,
    //                 stack: err instanceof Error ? err.stack : undefined,
    //             });
    //         }
    //         alert(errorMessage);
    //     } finally {
    //         setWatchlistLoading(false);
    //     }
    // };

    // const handleRemoveFromWatchlist = async () => {
    //     if (!mediaItem || !state.isAuthenticated) {
    //         alert('Please log in to remove from your watchlist.');
    //         return;
    //     }

    //     setWatchlistLoading(true);
    //     try {
    //         await removeFromWatchlist(mediaItem.id, mediaItem.media_type, state.authToken);
    //         setIsAddedToWatchlist(false);
    //         console.log(`${mediaItem.title} has been removed from your watchlist!`);
    //     } catch (err) {
    //         const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    //         console.error('Error in handleRemoveFromWatchlist:', {
    //             message: errorMessage,
    //             stack: err instanceof Error ? err.stack : undefined,
    //         });
    //         alert(errorMessage);
    //     } finally {
    //         setWatchlistLoading(false);
    //     }
    // };

    const handleReviewUpdated = async (updatedReview: Review) => {
        try {
            const savedReview = await updateReview(updatedReview._id!, updatedReview, state.authToken);
            setReviews((prevReviews) =>
                prevReviews.map((review) => (review._id === savedReview._id ? savedReview : review))
            );
        } catch (err) {
            console.error('Error updating review:', err);
            setError('Failed to update review. Please try again.');
        }
    };

    const handleReviewDeleted = async (reviewId: string) => {
        try {
            await deleteReview(reviewId, state.authToken);
            setReviews((prevReviews) => prevReviews.filter((review) => review._id !== reviewId));
        } catch (err) {
            console.error('Error deleting review:', err);
            setError('Failed to delete review. Please try again.');
        }
    };

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', my: 8 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    {error}
                </Typography>
                <Button variant="contained" component={RouterLink} to="/" sx={{ mt: 2 }}>
                    Return to Home
                </Button>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!mediaItem) {
        return (
            <Box sx={{ textAlign: 'center', my: 8 }}>
                <Typography variant="h6" gutterBottom>
                    Media not found
                </Typography>
                <Button variant="contained" component={RouterLink} to="/" sx={{ mt: 2 }}>
                    Return to Home
                </Button>
            </Box>
        );
    }

    const backdropUrl = mediaItem.backdrop_path
        ? `https://image.tmdb.org/t/p/original${mediaItem.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080?text=No+Backdrop+Available';

    const posterUrl = mediaItem.poster_path
        ? `https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster+Available';

    return (
        <Box>
            <BackdropContainer>
                <Box
                    component="img"
                    src={backdropUrl}
                    alt={mediaItem.title}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
                <BackdropOverlay>
                    <Container maxWidth="xl">
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <PosterImage src={posterUrl} alt={mediaItem.title} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={9}>
                                <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                                    {mediaItem.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Rating value={mediaItem.vote_average / 2} precision={0.5} readOnly sx={{ mr: 1 }} />
                                    <Typography variant="body1">
                                        {mediaItem.vote_average.toFixed(1)}/10 ({mediaItem.vote_count} votes)
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                    {mediaItem.genres?.map((genre: Genre) => (
                                        <Chip
                                            key={genre.id}
                                            label={genre.name}
                                            color="primary"
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                                <Typography variant="body1" paragraph>
                                    {mediaItem.overview}
                                </Typography>
                                {mediaItem.media_type === 'tv' && mediaItem.number_of_seasons && mediaItem.number_of_episodes && (
                                    <Typography variant="body1" gutterBottom>
                                        {mediaItem.number_of_seasons} season{mediaItem.number_of_seasons > 1 ? 's' : ''} •{' '}
                                        {mediaItem.number_of_episodes} episode{mediaItem.number_of_episodes > 1 ? 's' : ''}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <AnimatedButton
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<PlayArrow />}
                                        onClick={handleWatchTrailer}
                                        sx={{ px: 3, py: 1.2, fontWeight: 600, fontSize: '1rem' }}
                                    >
                                        Watch Trailer
                                    </AnimatedButton>
                                    {/* <AnimatedButton
                                        variant={isAddedToWatchlist ? 'outlined' : 'contained'}
                                        color={isAddedToWatchlist ? 'error' : 'secondary'}
                                        size="large"
                                        startIcon={<BookmarkAddIcon />}
                                        onClick={isAddedToWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
                                        sx={{
                                            px: 3,
                                            py: 1.2,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            backgroundColor: isAddedToWatchlist ? '#e0f7fa' : '#26c6da',
                                            color: '#000',
                                            '&:hover': {
                                                backgroundColor: isAddedToWatchlist ? '#b2ebf2' : '#00acc1',
                                            },
                                        }}
                                        disabled={watchlistLoading}
                                    >
                                        {watchlistLoading ? <CircularProgress size={24} /> : isAddedToWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                    </AnimatedButton> */}
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                </BackdropOverlay>
            </BackdropContainer>
            <Container maxWidth="xl">
                <Box sx={{ mb: 6 }}>
                    <SectionTitle variant="h4">Cast</SectionTitle>
                    <CastList cast={cast} title="Top Cast" />
                </Box>
                <Divider sx={{ my: 4 }} />
                <Box sx={{ mb: 6 }}>
                    <SectionTitle variant="h4">External Ratings & Reviews</SectionTitle>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <ExternalRatings ratings={externalRatings} movieId={''} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {ratingDistributionLoading ? (
                                <CircularProgress size={24} />
                            ) : totalRatings > 0 ? (
                                <RatingsDistribution distributions={ratingDistribution} totalRatings={totalRatings} />
                            ) : (
                                <Typography variant="body1">No ratings available.</Typography>
                            )}
                        </Grid>
                    </Grid>
                </Box>
                <Divider sx={{ my: 4 }} />

                {/* MovieReviews */}
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)', zIndex: 1, position: 'relative' }} />
                <MovieReviews movieId={id || ''} />
                {/* <Box sx={{ mb: 6 }}>
                    <SectionTitle variant="h4">User Reviews</SectionTitle>
                    <Box sx={{ mt: 4 }}>
                        <ReviewList
                            mediaId={id || ''}
                            mediaType={validMediaType}
                            reviews={reviews}
                            onReviewUpdated={handleReviewUpdated}
                            onReviewDeleted={handleReviewDeleted}
                        />
                    </Box>
                </Box> */}
            </Container>

            {/* Trailer Dialog */}
            <Dialog
                open={trailerOpen}
                onClose={handleCloseTrailer}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'hidden',
                        margin: { xs: 1, sm: 2, md: 4 },
                    },
                }}
            >
                <DialogContent
                    sx={{
                        p: 0,
                        position: 'relative',
                        aspectRatio: '16/9',
                        backgroundColor: '#000',
                    }}
                >
                    <IconButton
                        onClick={handleCloseTrailer}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: alpha(theme.palette.background.paper, 0.5),
                            color: theme.palette.common.white,
                            zIndex: 1,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.8),
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                    {trailerOpen && trailerKey && (
                        <Box
                            component="iframe"
                            width="100%"
                            height="100%"
                            src={getTrailerUrl()}
                            title={`${mediaItem.title || mediaItem.name} Trailer`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sx={{
                                border: 'none',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default DetailsPage;