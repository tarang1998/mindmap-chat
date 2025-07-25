import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../utils/supabase';
import log from '../../utils/logger';

export const signInWithOTP = createAsyncThunk(
    'auth/signInWithOTP',
    async ({ email }, { rejectWithValue }) => {
        try {
            log.debug('Sending OTP to email:', { email });
            
            const { error } = await supabase.auth.signInWithOtp({
                email,
                // options: {
                //     emailRedirectTo: `${window.location.origin}/`
                // }
            });

            if (error) {
                log.error('OTP send error:', error);
                throw error;
            }

            return { email };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const verifyOTP = createAsyncThunk(
    'auth/verifyOTP',
    async ({ email, token }, { rejectWithValue }) => {
        try {
            log.debug('Verifying OTP:', { email });
            
            const { data: { session }, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email'
            });

            if (error) {
                log.error('OTP verification error:', error);
                throw error;
            }

            return session;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signInWithEmail = createAsyncThunk(
    'auth/signInWithEmail',
    async ({ email, password, remember }, { rejectWithValue }) => {
        try {
            log.debug('Signing in with email:', { email, storageType: remember ? 'localStorage' : 'sessionStorage' });
            
            // Set the storage type based on remember preference
            const { data: { session }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
                options: {
                    persistSession: true, // Always persist, but we'll control where
                    storageType: remember ? 'localStorage' : 'sessionStorage' // Use localStorage for remember, sessionStorage otherwise
                }
            });

            if (error) {
                log.error('Email sign in error:', error);
                throw error;
            }

            return session;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (email, { rejectWithValue }) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) {
                log.error('Password reset error:', error);
                throw error;
            }

            return true;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

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
        checkingAuth: true,
        magicLinkSent: false,
        otpEmail: null, // For OTP sign-in flow
        magicLinkSent: false
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setMagicLinkSent: (state, action) => {
            state.magicLinkSent = action.payload;
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
            })

            // Sign in with email/password
            .addCase(signInWithEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signInWithEmail.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(signInWithEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reset password
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Sign in with OTP
            .addCase(signInWithOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signInWithOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.otpEmail = action.payload.email;
                // state.magicLinkSent = true; // Indicate that the magic link was sent
            })
            .addCase(signInWithOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Verify OTP
            .addCase(verifyOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.otpEmail = null;
            })
            .addCase(verifyOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, setMagicLinkSent } = authSlice.actions;
export default authSlice.reducer;
