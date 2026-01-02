import { create } from 'zustand';
import { authAPI, userBooksAPI, statsAPI } from '../services/api';

// Auth Store
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user data
      const userResponse = await authAPI.getCurrentUser();
      set({ user: userResponse.data, token: access_token, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  },
  
  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user data
      const userResponse = await authAPI.getCurrentUser();
      set({ user: userResponse.data, token: access_token, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  fetchUser: async () => {
    try {
      const response = await authAPI.getCurrentUser();
      set({ user: response.data });
    } catch (error) {
      // Token might be invalid
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
  
  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      set({ user: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Update failed' };
    }
  },
}));

// Library Store
export const useLibraryStore = create((set, get) => ({
  myBooks: [],
  stats: null,
  loading: false,
  
  fetchMyBooks: async (status = null) => {
    set({ loading: true });
    try {
      const response = await userBooksAPI.getMyBooks(status);
      set({ myBooks: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch books:', error);
    }
  },
  
  addBook: async (bookData) => {
    try {
      await userBooksAPI.addBookToLibrary(bookData);
      // Refresh the list
      get().fetchMyBooks();
      // Refresh points and reading goal
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to add book' };
    }
  },
  
  updateBook: async (bookId, updateData) => {
    try {
      await userBooksAPI.updateBook(bookId, updateData);
      // Refresh the list
      get().fetchMyBooks();
      // Refresh stats
      get().fetchStats();
      // Refresh points and reading goal
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      if (window.refreshStats) window.refreshStats();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update book' };
    }
  },
  
  removeBook: async (bookId) => {
    try {
      await userBooksAPI.removeBook(bookId);
      // Refresh the list
      get().fetchMyBooks();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove book' };
    }
  },
  
  fetchStats: async () => {
    try {
      const response = await statsAPI.getReadingStats();
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },
}));
