import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  verifyEmail: (token) => api.post('/auth/verify-email', null, { params: { token } }),
  resendVerification: (email) => api.post('/auth/resend-verification', null, { params: { email } }),
};

// Books API
export const booksAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  searchBooks: (query) => api.get('/books', { params: { search: query } }),
  searchExternal: (query, limit = 40, yearFrom = null, yearTo = null) => 
    api.get('/books/search-external', { 
      params: { 
        query, 
        limit,
        year_from: yearFrom || undefined,
        year_to: yearTo || undefined
      } 
    }),
  importBook: (bookData) => 
    api.post('/books/import-from-search', bookData),
  getBookReviews: (bookId, limit = 20) =>
    api.get(`/books/${bookId}/reviews`, { params: { limit } }),
  getPopularBooks: (limit = 10) =>
    api.get('/books/popular/top', { params: { limit } }),
  getTrendingBooks: (limit = 40) =>
    api.get('/books/trending', { params: { limit } }),
};

// Reviews API
export const reviewsAPI = {
  getRecent: (limit = 10) => api.get('/reviews/recent', { params: { limit } }),
  likeReview: (bookId, reviewerId) => 
    api.post(`/reviews/${bookId}/${reviewerId}/like`),
  unlikeReview: (bookId, reviewerId) => 
    api.delete(`/reviews/${bookId}/${reviewerId}/like`),
  getLikeCount: (bookId, reviewerId) => 
    api.get(`/reviews/${bookId}/${reviewerId}/likes`),
};

// Goals & Progress API
export const goalsAPI = {
  setReadingGoal: (goal, year) => api.post('/reading-goal', null, { params: { goal, year } }),
  getReadingGoal: () => api.get('/reading-goal'),
  updateProgress: (bookId, currentPage) => 
    api.put(`/my-books/${bookId}/progress`, null, { params: { current_page: currentPage } }),
};

// Points API
export const pointsAPI = {
  getPoints: () => api.get('/points'),
};

// Users API
export const usersAPI = {
  searchUsers: (query, limit = 20) => 
    api.get('/users/search', { params: { query, limit } }),
  browseAllUsers: (limit = 50, skip = 0) =>
    api.get('/users/browse/all', { params: { limit, skip } }),
  getUserProfile: (userId) => api.get(`/users/${userId}/profile`),
  getUserBooks: (userId, status = null) => 
    api.get(`/users/${userId}/books`, { params: { status } }),
  getUserReviews: (userId, limit = 20) => 
    api.get(`/users/${userId}/reviews`, { params: { limit } }),
};

// User Books API
export const userBooksAPI = {
  getMyBooks: (status) => api.get('/my-books', { params: { status } }),
  addBookToLibrary: (data) => api.post('/my-books', data),
  updateBook: (bookId, data) => api.put(`/my-books/${bookId}`, data),
  removeBook: (bookId) => api.delete(`/my-books/${bookId}`),
};

// Collections API
export const collectionsAPI = {
  getCollections: () => api.get('/collections'),
  createCollection: (data) => api.post('/collections', data),
  addBookToCollection: (collectionId, bookId) => 
    api.post(`/collections/${collectionId}/books/${bookId}`),
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: (params) => api.get('/recommendations', { params }),
};

// Social API
export const socialAPI = {
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
  getActivityFeed: (limit) => api.get('/feed', { params: { limit } }),
};

// Stats API
export const statsAPI = {
  getReadingStats: () => api.get('/stats/reading'),
  getDetailedStats: () => api.get('/stats/detailed'),
  getReadingStreak: () => api.get('/stats/reading-streak'),
};

// Import API
export const importAPI = {
  previewGoodreads: (csvContent) => api.post('/import/goodreads/preview', csvContent, {
    headers: { 'Content-Type': 'text/plain' }
  }),
  importGoodreads: (csvContent) => api.post('/import/goodreads', csvContent, {
    headers: { 'Content-Type': 'text/plain' }
  }),
};

// Reading Circles API
export const circlesAPI = {
  // Circle management
  getMyCircles: () => api.get('/circles'),
  discoverCircles: (limit = 20) => api.get('/circles/discover', { params: { limit } }),
  createCircle: (data) => api.post('/circles', data),
  getCircle: (circleId) => api.get(`/circles/${circleId}`),
  deleteCircle: (circleId) => api.delete(`/circles/${circleId}`),
  
  // Membership
  joinCircle: (circleId) => api.post(`/circles/${circleId}/join`),
  joinByCode: (inviteCode) => api.post(`/circles/join/${inviteCode}`),
  leaveCircle: (circleId) => api.delete(`/circles/${circleId}/leave`),
  
  // Challenges
  getChallenges: (circleId, activeOnly = true) => 
    api.get(`/circles/${circleId}/challenges`, { params: { active_only: activeOnly } }),
  createChallenge: (circleId, data) => api.post(`/circles/${circleId}/challenges`, data),
  updateProgress: (circleId, challengeId, value) => 
    api.put(`/circles/${circleId}/challenges/${challengeId}/progress`, null, { params: { value } }),
  syncFromLibrary: (circleId, challengeId) =>
    api.post(`/circles/${circleId}/challenges/${challengeId}/sync`),
  
  // Activity & Leaderboard
  getActivity: (circleId, limit = 30) => 
    api.get(`/circles/${circleId}/activity`, { params: { limit } }),
  getLeaderboard: (circleId) => api.get(`/circles/${circleId}/leaderboard`),
};

export default api;
