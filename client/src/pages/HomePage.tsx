import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { MediaItem, Genre } from '../types'; // Import MediaItem
import { useScroll } from '../context/ScrollContext';
import {
    getTrendingMovies,
    getTrendingTVShows,
    getTopRatedMovies,
    getTvShows,
    getMovieGenres,
    getMovieVideos,
} from '../services/sharedServices';
import Hero from '../components/Home/Hero';
import MovieGrid from '../components/Movies/MovieGrid';
import TrendingToggle from '../components/Movies/TrendingToggle';

interface HeroProps {
    movies: MediaItem[];
}

interface TVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    backdrop_path?: string;
    first_air_date?: string;
    vote_average?: number;
    vote_count?: number;
    genre_ids?: number[];
}

interface TrendingToggleProps {
    movies: MediaItem[];
    tvShows: MediaItem[];
    loading: boolean;
    genreMap: Record<number, string>;
}

const HomePage: React.FC = () => {
    const { scrollRef } = useScroll();
    const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
    const [trendingTVShows, setTrendingTVShows] = useState<MediaItem[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
    const [topRatedTVShows, setTopRatedTVShows] = useState<MediaItem[]>([]);
    const [genreMap, setGenreMap] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch genres first to build the genre map
                const genres = await getMovieGenres();
                const genreMapping: Record<number, string> = {};
                genres.forEach((genre: { id: number, name: string }) => {
                    genreMapping[genre.id] = genre.name;
                });
                setGenreMap(genreMapping);

                // Map items to MediaItem and fetch videos for trending movies
                const mapToMediaItem = async (
                    item: any,
                    mediaType: 'movie' | 'tv',
                    fetchVideos: boolean = false
                ): Promise<MediaItem> => {
                    const baseItem: MediaItem = {
                        id: item.id,
                        title: item.title || item.name || 'Unknown',
                        name: item.name,
                        overview: item.overview,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path || '',
                        release_date: item.release_date || item.first_air_date || '',
                        vote_average: item.vote_average || 0,
                        vote_count: item.vote_count || 0,
                        genre_ids: item.genre_ids || [],
                        media_type: mediaType,
                    };

                    // Fetch videos only for trending movies used in Hero
                    if (fetchVideos && mediaType === 'movie') {
                        const videoData = await getMovieVideos(item.id);
                        return {
                            ...baseItem,
                            videos: videoData.results ? { results: videoData.results } : undefined,
                        };
                    }
                    return baseItem;
                };

                // Fetch all media data in parallel
                const [moviesData, tvShowsData, topMoviesData, topTVData] = await Promise.all([
                    getTrendingMovies(),
                    getTrendingTVShows(),
                    getTopRatedMovies(),
                    getTvShows(),
                ]);

                // Fetch videos for the first 5 trending movies (used in Hero)
                const mappedTrendingMovies = await Promise.all(
                    moviesData.results?.map(async (m: any, index: number) => {
                        return await mapToMediaItem(m, 'movie', index < 5);
                    }) || []
                );

                // Map other data, resolving promises with Promise.all
                const mappedTrendingTVShows = await Promise.all(
                    tvShowsData.results?.map(async (m: any) => await mapToMediaItem(m, 'tv')) || []
                );
                const mappedTopRatedMovies = await Promise.all(
                    topMoviesData.results?.map(async (m: any) => await mapToMediaItem(m, 'movie')) || []
                );
                const mappedTopRatedTVShows = await Promise.all(
                    topTVData.results?.map(async (m: any) => await mapToMediaItem(m, 'tv')) || []
                );

                setTrendingMovies(mappedTrendingMovies);
                setTrendingTVShows(mappedTrendingTVShows);
                setTopRatedMovies(mappedTopRatedMovies);
                setTopRatedTVShows(mappedTopRatedTVShows);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (error) {
        return (
            <Box ref={scrollRef} sx={{ overflowY: 'auto', height: '100vh', paddingBottom: 4 }}>
                <Box sx={{ textAlign: 'center', my: 8, py: 8 }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 2 }}
                    >
                        Retry
                    </Button>
                </Box>
            </Box>
        );
    }

    // Only render the Hero when we have movies to display
    const heroMovies = !loading && trendingMovies.length > 0
        ? trendingMovies.slice(0, 5).map((movie) => ({
            ...movie,
            backdrop_path: movie.backdrop_path || '', // Provide a default value for `backdrop_path`
        }))
        : [];

    return (
        <Container maxWidth="xl">
            {/* Hero Section */}
            {heroMovies.length > 0 && (
                <Hero movies={heroMovies} />
            )}

            {/* Trending Section with Toggle */}
            <TrendingToggle
                movies={trendingMovies}
                tvShows={trendingTVShows}
                loading={loading}
                genreMap={genreMap}
            />

            {/* Top Rated Movies Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h2" fontWeight="bold">
                    Top Rated Movies
                </Typography>
                <Button
                    component={Link}
                    to="/top-rated"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                >
                    View All
                </Button>
            </Box>
            <MovieGrid
                movies={topRatedMovies.slice(0, 8)}
                loading={loading}
                genreMap={genreMap}
                mediaType="movie"
            />

            {/* Top Rated TV Shows Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h2" fontWeight="bold">
                    Top Rated TV Shows
                </Typography>
                <Button
                    component={Link}
                    to="/top-rated-tv"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                >
                    View All
                </Button>
            </Box>
            <MovieGrid
                movies={topRatedTVShows.slice(0, 8)}
                loading={loading}
                genreMap={genreMap}
                mediaType="tv"
            />
        </Container>
    );
};

export default HomePage;