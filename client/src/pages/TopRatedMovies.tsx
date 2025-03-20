import React, { useEffect, useState } from 'react';
import { getTopRatedMovies } from '../services/sharedServices';
import MovieGrid from '../components/Movies/MovieGrid';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { Movie } from '../types';

const TopRatedMoviesPage = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top
    }, []);

    useEffect(() => {
        const fetchTopRatedMovies = async () => {
            try {
                const data = await getTopRatedMovies();
                setMovies(data.results);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTopRatedMovies();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Typography variant="h5" color="error" align="center">
                    Error: {error}
                </Typography>
            </Container>
        );
    }

    return (
        <Container>
            <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mt: 4 }}>
                Top Rated Movies
            </Typography>
            <MovieGrid movies={movies} mediaType={'movie'} />
        </Container>
    );
};

export default TopRatedMoviesPage;