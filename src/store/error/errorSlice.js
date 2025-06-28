import { createSlice } from '@reduxjs/toolkit';

const errorSlice = createSlice({
    name: 'error',
    initialState: {
        errors: [],
        globalError: null
    },
    reducers: {
        addError: (state, action) => {
            state.errors.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...action.payload
            });
        },
        removeError: (state, action) => {
            state.errors = state.errors.filter(error => error.id !== action.payload);
        },
        clearErrors: (state) => {
            state.errors = [];
        },
        setGlobalError: (state, action) => {
            state.globalError = action.payload;
        },
        clearGlobalError: (state) => {
            state.globalError = null;
        }
    }
});

export const {
    addError,
    removeError,
    clearErrors,
    setGlobalError,
    clearGlobalError
} = errorSlice.actions;

export default errorSlice.reducer; 