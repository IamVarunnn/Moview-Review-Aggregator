import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Tabs,
    Tab,
    Pagination,
    Alert,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { Search as SearchIcon, Clear } from '@mui/icons-material';
import { Movie } from '../types';
import { searchMovies } from '../services/sharedServices';
import MovieGrid from '../components/Movies/MovieGrid';
import { useScroll } from '../context/ScrollContext';
// Extended Movie type to handle both movies and TV shows
interface MediaItem extends Movie {
    name?: string;
    first_air_date?: string;
    genre_ids?: number[];
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`search-tabpanel-${index}`}
            aria-labelledby={`search-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

const SearchPage: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('query') || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    let navigate = useNavigate();
    const { scrollRef } = useScroll();

    // Filter results based on tab selection
    const movieResults = searchResults.filter(item => !item.first_air_date);
    const tvResults = searchResults.filter(item => !!item.first_air_date);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery, 1);
        }
    }, [initialQuery]);

    const performSearch = async (query: string, pageNum: number) => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError(null);

            const response = await searchMovies(query, pageNum);
            setSearchResults(response.results || []);
            setTotalPages(Math.min(response.total_pages || 1, 20)); // Limit to 20 pages max
            setPage(pageNum);

            // Update URL with search query
            navigate(`/search?query=${encodeURIComponent(query)}&page=${pageNum}`, { replace: true });
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to perform search. Please try again.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            performSearch(searchQuery, 1);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        navigate('/search', { replace: true });
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        performSearch(searchQuery, value);
        window.scrollTo(0, 0);
    };

    return (
        <Box ref={scrollRef} sx={{ overflowY: 'auto', height: '100vh', paddingBottom: 4 }}>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        Search Movies & TV Shows
                    </Typography>

                    {/* Search Form */}
                    <Box
                        component="form"
                        onSubmit={handleSearch}
                        sx={{
                            mt: 3,
                            mb: 4,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                        }}
                    >
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search for movies, TV shows, actors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClearSearch} edge="end" size="small">
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                bgcolor: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.common.white, 0.05)
                                    : alpha(theme.palette.common.black, 0.05),
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />
                    </Box>

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Search Results */}
                    {!loading && searchResults.length > 0 && (
                        <>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    aria-label="search results tabs"
                                    textColor="primary"
                                    indicatorColor="primary"
                                >
                                    <Tab label={`All (${searchResults.length})`} />
                                    <Tab label={`Movies (${movieResults.length})`} />
                                    <Tab label={`TV Shows (${tvResults.length})`} />
                                </Tabs>
                            </Box>

                            <TabPanel value={tabValue} index={0}>
                                <MovieGrid
                                    movies={searchResults} mediaType={'movie'} />
                                {searchResults.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No results found. Try a different search term.
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <MovieGrid
                                    movies={movieResults} mediaType={'movie'} />
                                {movieResults.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No movie results found. Try a different search term.
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            <TabPanel value={tabValue} index={2}>
                                <MovieGrid
                                    movies={tvResults} mediaType={'movie'} />
                                {tvResults.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No TV show results found. Try a different search term.
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="large"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}
                        </>
                    )}

                    {/* No Results Message */}
                    {!loading && searchQuery && searchResults.length === 0 && !error && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No results found for "{searchQuery}"
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Try different keywords or check your spelling
                            </Typography>
                        </Box>
                    )}

                    {/* Initial State */}
                    {!loading && !searchQuery && searchResults.length === 0 && !error && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Enter a search term to find movies and TV shows
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Search by title, actor, director, or genre
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default SearchPage;

function alpha(color: string, value: number): string {
    return `${color}${Math.round(value * 255).toString(16).padStart(2, '0')}`;
} 