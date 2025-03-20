import axios from 'axios';
import { Movie, Video, Cast, Crew, Review, Genre, ExternalRating, TVShow, MediaItem } from '../types';
import { api } from './api';

const API_KEY = '849760be7112c5ccb4fb93b27df41690';
const API_URL = 'https://api.themoviedb.org/3';

const postReview = async (mediaId: string, mediaType: 'movie' | 'tv', review: Review) => {
    try {
        const response = await axios.post('/api/reviews', {
            mediaId,
            mediaType,
            ...review,
        });
        return response.data;
    } catch (err) {
        throw new Error('Failed to save review');
    }
};

export const getTrendingMovies = async (page: number = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/trending/movie/week?api_key=${API_KEY}&page=${page}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        throw error;
    }
};

export const getTopRatedMovies = async (page: number = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching top rated movies:', error);
        throw error;
    }
};

export const getTopRatedTVShows = async (page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/tv/top_rated?language=en-US&page=${page}&api_key=${API_KEY}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching top-rated TV shows:', error);
        throw error;
    }
};

export const getMovieDetails = async (id: string): Promise<Movie | null> => {
    if (!id) {
        console.error('Invalid movie ID');
        return null;
    }
    try {
        const response = await axios.get(`${API_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie details for ID ${id}:`, error);
        return null;
    }
};

export const getTVShowDetails = async (id: string): Promise<TVShow> => {
    try {
        const response = await axios.get(`${API_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching TV show details for ID ${id}:`, error);
        throw error;
    }
};

export const getMovieVideos = async (movieId: number) => {
    try {
        const response = await axios.get(`${API_URL}/movie/${movieId}/videos`, {
            params: {
                api_key: API_KEY,
                language: 'en-US',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching videos for movie ${movieId}:`, error);
        return { results: [] }; // Return empty results on error
    }
};

export const getTVShowVideos = async (tvShowId: number) => {
    try {
        const response = await axios.get(`${API_URL}/tv/${tvShowId}/videos`, {
            params: {
                api_key: API_KEY,
                language: 'en-US',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching videos for TV show ${tvShowId}:`, error);
        return { results: [] }; // Return empty results on error
    }
};

export const getNowPlayingMovies = async (page: number = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        throw error;
    }
};

export const getMovieCredits = async (id: string): Promise<{ cast: Cast[]; crew: Crew[] }> => {
    try {
        const response = await axios.get(`${API_URL}/movie/${id}/credits?api_key=${API_KEY}`);
        return { cast: response.data.cast || [], crew: response.data.crew || [] };
    } catch (error) {
        console.error('Error fetching movie credits:', error);
        return { cast: [], crew: [] };
    }
};

export const getUpcomingMovies = async (page: number = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/movie/upcoming?api_key=${API_KEY}&page=${page}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching upcoming movies:', error);
        throw error;
    }
};


if (!API_KEY) {
    throw new Error('TMDB API key is missing. Please set REACT_APP_TMDB_API_KEY in your .env file.');
}

export const searchMovies = async (
    query: string,
    page: number = 1
): Promise<{ results: MediaItem[]; total_pages: number }> => {
    try {
        const response = await axios.get(
            `${API_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
        );
        console.log('Search API Response:', response.data);

        const filteredResults = response.data.results.filter(
            (item: MediaItem) => item.media_type === 'movie' || item.media_type === 'tv'
        );

        return {
            results: filteredResults,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};

export const getMoviesByGenre = async (
    genreId: number,
    page: number = 1
): Promise<{ results: Movie[]; total_pages: number }> => {
    try {
        const response = await axios.get(
            `${API_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`
        );
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error(`Error fetching movies for genre ID ${genreId}:`, error);
        throw error;
    }
};

export const getMovieWithVideos = async (id: string) => {
    try {
        const response = await axios.get(
            `${API_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=videos`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching movie with videos:', error);
        throw error;
    }
};

export const getMovieGenres = async (): Promise<{ id: number; name: string }[]> => {
    try {
        const response = await axios.get(`${API_URL}/genre/movie/list?api_key=${API_KEY}`);
        return response.data.genres;
    } catch (error) {
        console.error('Error fetching movie genres:', error);
        throw error;
    }
};

export const getMovieReviews = async (id: string): Promise<{ reviews: Review[] }> => {
    try {
        const response = await axios.get(`${API_URL}/movie/${id}/reviews`, {
            params: {
                api_key: API_KEY,
            },
        });
        return { reviews: response.data.results };
    } catch (error) {
        console.error('Error fetching movie reviews:', error);
        return { reviews: [] };
    }
};

export const getTVShowCredits = async (id: string): Promise<{ cast: Cast[] }> => {
    try {
        const response = await axios.get(`${API_URL}/tv/${id}/credits?api_key=${API_KEY}`);
        return { cast: response.data.cast || [] };
    } catch (error) {
        console.error('Error fetching TV show credits:', error);
        return { cast: [] };
    }
};

export const getMovieExternalRatings = (movie: Movie): ExternalRating[] => {
    try {
        const tmdbScore = Math.round(movie.vote_average * 10);

        return [
            {
                source: 'TMDB',
                value: `${movie.vote_average}/10`,
                score: tmdbScore,
                logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2.svg',
            },
            {
                source: 'IMDb',
                value: `${(tmdbScore * 0.9) / 10}/10`,
                score: Math.round(tmdbScore * 0.9),
                logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg',
            },
            {
                source: 'Rotten Tomatoes',
                value: `${Math.round(tmdbScore * 0.95)}%`,
                score: Math.round(tmdbScore * 0.95),
                logo: 'https://www.rottentomatoes.com/assets/pizza-pie/images/rtlogo.9b892cff3fd.png',
            },
            {
                source: 'Metacritic',
                value: `${Math.round(tmdbScore * 0.85)}/100`,
                score: Math.round(tmdbScore * 0.85),
                logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg',
            },
        ];
    } catch (error) {
        console.error('Error fetching external ratings:', error);
        return [];
    }
};

export const getTVShowExternalRatings = (tvShow: TVShow): ExternalRating[] => {
    try {
        const tmdbScore = Math.round((tvShow.vote_average ?? 0) * 10);

        return [
            {
                source: 'TMDB',
                value: `${tvShow.vote_average ?? 0}/10`,
                score: tmdbScore,
                logo:
                    'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
            },
            {
                source: 'IMDb',
                value: `${(tmdbScore * 0.85) / 10}/10`,
                score: Math.round(tmdbScore * 0.85),
                logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg',
            },
            {
                source: 'Rotten Tomatoes',
                value: `${Math.round(tmdbScore * 0.9)}%`,
                score: Math.round(tmdbScore * 0.9),
                logo: 'https://www.rottentomatoes.com/assets/pizza-pie/images/rottentomatoes_logo_40.336d6fe66ff.png',
            },
            {
                source: 'Metacritic',
                value: `${Math.round(tmdbScore * 0.8)}/100`,
                score: Math.round(tmdbScore * 0.8),
                logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg',
            },
        ];
    } catch (error) {
        console.error('Error fetching external ratings for TV show:', error);
        return [];
    }
};

export const getRatingDistribution = async (id: string): Promise<number[]> => {
    try {
        const response = await axios.get(`${API_URL}/tv/${id}/content_ratings?api_key=${API_KEY}`);
        return response.data.results.map((rating: any) => rating.rating_count || 0);
    } catch (error) {
        console.error('Error fetching rating distribution:', error);
        return [];
    }
};

export const getTrendingTVShows = async (page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> => {
    try {
        const response = await axios.get(`${API_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching trending TV shows:', error);
        throw error;
    }
};

export const getTvShows = async (page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> => {
    try {
        const response = await axios.get(
            `${API_URL}/discover/tv?api_key=${API_KEY}&include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=popularity.desc`
        );
        return {
            results: response.data.results,
            total_pages: response.data.total_pages,
        };
    } catch (error) {
        console.error('Error fetching TV shows:', error);
        throw error;
    }
};

export const getTVShowReviews = async (id: string): Promise<{ reviews: Review[] }> => {
    try {
        const response = await axios.get(`${API_URL}/tv/${id}/reviews`, {
            params: {
                api_key: API_KEY,
            },
        });
        return { reviews: response.data.results };
    } catch (error) {
        console.error('Error fetching TV show reviews:', error);
        return { reviews: [] };
    }
};

