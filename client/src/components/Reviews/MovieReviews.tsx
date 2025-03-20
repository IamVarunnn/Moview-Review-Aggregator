import React, { useState, useEffect, FormEvent } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    Avatar,
    Rating,
    useTheme,
    IconButton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Review, ReviewFormData } from '../../types';
import reviewService from '../../services/reviewService'; // Adjust the path as needed
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { io, Socket } from 'socket.io-client';

interface MovieReviewsProps {
    movieId: string;
    currentUserId?: string; // Add currentUserId to identify the logged-in user
}

const Container = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    width: '100%',
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
        animation: `${keyframes`
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        `} 15s ease-in-out infinite`,
    },
}));

const ReviewItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    padding: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: theme.spacing(2),
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 4px 15px rgba(70, 130, 180, 0.2)',
    },
}));

const ReviewFormContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.15), rgba(255, 215, 0, 0.15))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: theme.spacing(3),
}));

const OverallReviewCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.15), rgba(255, 215, 0, 0.15))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    boxShadow: '0 4px 15px rgba(70, 130, 180, 0.2)',
    zIndex: 1,
    animation: `${keyframes`
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    `} 0.8s ease-in-out`,
    '&:hover': {
        boxShadow: '0 6px 20px rgba(70, 130, 180, 0.3)',
    },
}));

const RatingIndicator = styled(Box)<{ value: number }>(({ theme, value }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: 60,
    height: 60,
    background: `conic-gradient(from 0deg, #FFD700 0%, #FFD700 ${value * 20}%, rgba(255, 255, 255, 0.1) ${value * 20}%, rgba(255, 255, 255, 0.1) 100%)`,
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.5)',
    animation: `${keyframes`
        0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
    `} 2s infinite ease-in-out`,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
    },
}));

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
    animation: `${keyframes`
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); }
    `} 0.8s ease`,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

const MovieReviews: React.FC<MovieReviewsProps> = ({ movieId, currentUserId }) => {
    const theme = useTheme();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [totalReviews, setTotalReviews] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(5);
    const [newReview, setNewReview] = useState<ReviewFormData>({ rating: 0, content: '' });
    const [editReview, setEditReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

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

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await reviewService.getMovieReviews(movieId, page, limit);
            setReviews((prev) => (page === 1 ? response.reviews : [...prev, ...response.reviews]));
            setTotalReviews(response.total);
        } catch (err: any) {
            setError(err.message || 'Failed to load reviews. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            withCredentials: true,
        });
        setSocket(newSocket);

        newSocket.emit('joinMovie', movieId);

        newSocket.on('reviewAdded', (newReview: Review) => {
            setReviews((prev) => {
                if (prev.some((r) => r._id === newReview._id)) {
                    return prev;
                }
                return [newReview, ...prev];
            });
            setTotalReviews((prev) => prev + 1);
        });

        newSocket.on('reviewUpdated', (updatedReview: Review) => {
            setReviews((prev) =>
                prev.map((r) => (r._id === updatedReview._id ? updatedReview : r))
            );
        });

        newSocket.on('reviewDeleted', (reviewId: string) => {
            setReviews((prev) => prev.filter((r) => r._id !== reviewId));
            setTotalReviews((prev) => prev - 1);
        });

        fetchReviews();

        const pollingInterval = setInterval(fetchReviews, 30000);

        return () => {
            newSocket.disconnect();
            clearInterval(pollingInterval);
        };
    }, [movieId, page]);

    const overallRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    const sentiment =
        overallRating >= 4 ? 'Highly Positive' : overallRating >= 3 ? 'Mixed' : 'Critical';

    const handleRatingChange = (event: React.ChangeEvent<{}>, value: number | null) => {
        if (editReview) {
            setEditReview((prev) => prev && { ...prev, rating: value || 0 });
        } else {
            setNewReview((prev) => ({ ...prev, rating: value || 0 }));
        }
    };

    const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (editReview) {
            setEditReview((prev) => prev && { ...prev, content: event.target.value });
        } else {
            setNewReview((prev) => ({ ...prev, content: event.target.value }));
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const reviewData = editReview || newReview;
        if (reviewData.rating < 1 || reviewData.rating > 5 || !reviewData.content.trim()) {
            setError('Please provide a rating (1-5) and a review comment.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (editReview) {
                const updatedReview = await reviewService.updateReview(editReview._id, {
                    rating: reviewData.rating,
                    content: reviewData.content,
                });
                setReviews((prev) =>
                    prev.map((r) => (r._id === updatedReview._id ? updatedReview : r))
                );
                if (socket) {
                    socket.emit('reviewUpdated', updatedReview);
                }
                setEditReview(null);
            } else {
                const createdReview = await reviewService.createReview(movieId, reviewData);
                setReviews((prev) => [createdReview, ...prev]);
                setTotalReviews((prev) => prev + 1);
                if (socket) {
                    socket.emit('reviewAdded', movieId, createdReview);
                }
                setNewReview({ rating: 0, content: '' });
            }
        } catch (err: any) {
            setError(err.message || (editReview ? 'Failed to update review.' : 'Failed to submit review.'));
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (reviewId: string) => {
        try {
            const updatedReview = await reviewService.likeReview(reviewId);
            setReviews((prev) =>
                prev.map((r) => (r._id === updatedReview._id ? updatedReview : r))
            );
            if (socket) {
                socket.emit('reviewUpdated', updatedReview);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to like/unlike review.');
        }
    };

    const handleEdit = (review: Review) => {
        setEditReview(review);
        setNewReview({ rating: review.rating, content: review.content });
    };

    const handleDelete = async (reviewId: string) => {
        try {
            await reviewService.deleteReview(reviewId);
            setReviews((prev) => prev.filter((r) => r._id !== reviewId));
            setTotalReviews((prev) => prev - 1);
            if (socket) {
                socket.emit('reviewDeleted', reviewId, movieId);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete review.');
        }
    };

    const handleLoadMore = () => {
        setPage((prev) => prev + 1);
    };

    return (
        <Container>
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
                User Reviews
            </Typography>

            {reviews.length > 0 && (
                <>
                    <OverallReviewCard sx={{ mb: 3 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: colors.text.primary,
                                fontFamily: 'Roboto, sans-serif',
                                mb: 1.5,
                            }}
                        >
                            Overall User Rating
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                                <RatingIndicator value={overallRating}>
                                    {overallRating.toFixed(1)}
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
                                    {overallRating.toFixed(1)}/5
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.text.secondary,
                                        fontFamily: 'Roboto, sans-serif',
                                    }}
                                >
                                    Based on {totalReviews} user review{totalReviews !== 1 ? 's' : ''}
                                </Typography>
                                <SentimentBadge sentiment={sentiment} sx={{ mt: 1 }}>
                                    {sentiment}
                                </SentimentBadge>
                            </Box>
                        </Box>
                    </OverallReviewCard>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </>
            )}

            {/* {currentUserId ? (
                <ReviewFormContainer>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: colors.text.primary,
                            fontFamily: 'Roboto, sans-serif',
                            mb: 2,
                        }}
                    >
                        {editReview ? 'Edit Your Review' : 'Add Your Review'}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ color: colors.text.secondary }}>
                                    Rating:
                                </Typography>
                                <Rating
                                    name="user-rating"
                                    value={editReview ? editReview.rating : newReview.rating}
                                    onChange={handleRatingChange}
                                    precision={0.5}
                                    sx={{
                                        color: colors.secondary,
                                        '& .MuiRating-iconEmpty': {
                                            color: 'rgba(255, 255, 255, 0.3)',
                                        },
                                    }}
                                />
                            </Box>
                            <TextField
                                label="Your Review"
                                multiline
                                rows={3}
                                value={editReview ? editReview.content : newReview.content}
                                onChange={handleContentChange}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: colors.text.primary,
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.primary,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: colors.text.secondary,
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: colors.primary,
                                    },
                                }}
                            />
                            {error && (
                                <Typography color="error" variant="body2">
                                    {error}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        backgroundColor: colors.primary,
                                        color: '#fff',
                                        '&:hover': {
                                            backgroundColor: '#5a9bd4',
                                        },
                                    }}
                                >
                                    {loading
                                        ? editReview
                                            ? 'Updating...'
                                            : 'Submitting...'
                                        : editReview
                                            ? 'Update Review'
                                            : 'Submit Review'}
                                </Button>
                                {editReview && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setEditReview(null);
                                            setNewReview({ rating: 0, content: '' });
                                        }}
                                        sx={{
                                            color: colors.text.secondary,
                                            borderColor: colors.text.secondary,
                                            '&:hover': {
                                                borderColor: colors.primary,
                                                color: colors.primary,
                                            },
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </form>
                </ReviewFormContainer>
            ) : (
                // <Typography sx={{ color: colors.text.secondary, mb: 3 }}>
                //     Please log in to add a review.
                // </Typography>
            )} */}

            {loading && reviews.length === 0 ? (
                <Typography sx={{ color: colors.text.secondary }}>
                    Loading reviews...
                </Typography>
            ) : reviews.length === 0 ? (
                <Typography sx={{ color: colors.text.secondary }}>
                    No reviews yet. Be the first to add one!
                </Typography>
            ) : (
                <>
                    {reviews.map((review) => (
                        <ReviewItem key={review._id}>
                            <Avatar
                                src={review.user.profilePicture}
                                alt={review.user.username}
                                sx={{ width: 40, height: 40, mr: 2 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ color: colors.text.primary }}
                                    >
                                        {review.user.username}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Rating
                                            value={review.rating}
                                            readOnly
                                            precision={0.5}
                                            size="small"
                                            sx={{
                                                color: colors.secondary,
                                                '& .MuiRating-iconEmpty': {
                                                    color: 'rgba(255, 255, 255, 0.3)',
                                                },
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{ color: colors.text.secondary }}
                                        >
                                            {review.rating}/5
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{ color: colors.text.secondary, mb: 1 }}
                                >
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ color: colors.text.primary }}
                                >
                                    {review.content}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <IconButton
                                            onClick={() => handleLike(review._id)}
                                            sx={{
                                                color: review.likes?.includes(currentUserId || '')
                                                    ? colors.primary
                                                    : colors.text.secondary,
                                            }}
                                            disabled={!currentUserId}
                                        >
                                            <ThumbUpIcon fontSize="small" />
                                        </IconButton>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: colors.text.secondary }}
                                        >
                                            {review.likes?.length || 0} likes
                                        </Typography>
                                    </Box>
                                    {currentUserId === review.user.id && (
                                        <>
                                            <IconButton
                                                onClick={() => handleEdit(review)}
                                                sx={{ color: colors.text.secondary }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDelete(review._id)}
                                                sx={{ color: colors.text.secondary }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </ReviewItem>
                    ))}
                    {reviews.length < totalReviews && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handleLoadMore}
                                disabled={loading}
                                sx={{
                                    color: colors.text.secondary,
                                    borderColor: colors.text.secondary,
                                    '&:hover': {
                                        borderColor: colors.primary,
                                        color: colors.primary,
                                    },
                                }}
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default MovieReviews;