// User types
export interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
    avatar?: string;

}

// Add this to your types.ts file
export interface TMDBTVShowResponse {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genres: { id: number; name: string }[];
    number_of_seasons: number;
    number_of_episodes: number;
    episode_run_time: number[];
    status: string;
    original_language: string;
    origin_country: string[];
    // Add any other properties from the API response
}

// In types.ts
export interface BaseMediaItem {
    id: number;
    title: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    media_type: string;
}

export interface MovieItem extends BaseMediaItem {
    media_type: 'movie';
    // Movie-specific properties
}

export interface TVShowItem extends BaseMediaItem {
    media_type: 'tv';
    number_of_seasons?: number;
    number_of_episodes?: number;
    episode_run_time?: number[];
    // Any other TV-specific properties
}

// export type MediaItem = MovieItem | TVShowItem;

// types.ts
export interface TVShow {
    genre_ids: never[];
    number_of_episodes: number | undefined;
    number_of_seasons: number | undefined;
    id: number;
    name: string;
    poster_path:
    string;
    backdrop_path: string;
    overview: string;
    genres: Genre[];
    vote_count: number;
    first_air_date: string;
    vote_average: number;
    videos: {
        results: Video[];

    }
}




export interface MediaItem {
    id: number;
    title: string;  // Optional for TV shows
    name?: string;   // Optional for movies
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date: string;    // For movies
    first_air_date?: string;  // For TV shows
    vote_average: number;
    vote_count: number;
    genre_ids?: number[];
    genres?: Array<{ id: number; name: string }>; // Add this line
    media_type?: 'movie' | 'tv';
    number_of_seasons?: number;
    number_of_episodes?: number;
    episode_run_time?: number[];
    runtime?: number;
    videos?: {
        results: Video[];
    };
}


export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
    authToken: string | null;
}

// Movie types
export interface Movie {
    id: number;
    title: string;
    name?: string;
    poster_path: string;
    backdrop_path: string;
    overview: string;
    release_date: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    genres?: Genre[];
    runtime?: number;
    number_of_seasons?: number;
    status?: string;
    tagline?: string;
    videos?: {
        results: Video[];
    };
    credits?: {
        cast: Cast[];
        crew: Crew[];
    };
    similar?: {
        results: Movie[];
    };
    external_ids?: {
        imdb_id?: string;
    };
    external_ratings?: {
        tmdb?: {
            score: number;
            votes: number;
        };
        imdb?: {
            score: number;
            votes: number;
        };
        rottenTomatoes?: {
            score: number;
        };
        metacritic?: {
            score: number;
        };
    };
}

// Review types
export interface Review {
    _id: string;
    user: User;
    movie: string;
    rating: number;
    content: string;
    likes?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ReviewFormData {
    rating: number;
    content: string;
}



export interface Genre {
    id: number;
    name: string;
}

export interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface Crew {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface ExternalRating {
    id?: string;
    source: string;
    value: string;
    logo?: string;
    score?: number;
}

export interface RatingDistribution {
    rating: number;
    count: number;
    percentage: number;
}

