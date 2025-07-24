import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../utils/supabase';
import log from '../../utils/logger';

// Async thunks for authentication operations
export const signInWithGoogle = createAsyncThunk(
    'auth/signInWithGoogle',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                log.error('Google sign in error:', error);
                throw error;
            }

            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);



export const signOut = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                log.error('Sign out error:', error);
                throw error;
            }
            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkAuthState = createAsyncThunk(
    'auth/checkAuthState',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                log.error('Auth state check error:', error);
                throw error;
            }
            return session;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        checkingAuth: true
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Check Auth State
            .addCase(checkAuthState.pending, (state) => {
                state.checkingAuth = true;
                state.error = null;
            })
            .addCase(checkAuthState.fulfilled, (state, action) => {
                state.checkingAuth = false;
                state.isAuthenticated = !!action.payload;
                state.user = action.payload?.user || null;
                state.loading = false
            })
            .addCase(checkAuthState.rejected, (state, action) => {
                state.checkingAuth = false;
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false
            })

            // Sign In with Google
            .addCase(signInWithGoogle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signInWithGoogle.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(signInWithGoogle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })


            // Sign Out
            .addCase(signOut.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signOut.fulfilled, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })
            .addCase(signOut.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
