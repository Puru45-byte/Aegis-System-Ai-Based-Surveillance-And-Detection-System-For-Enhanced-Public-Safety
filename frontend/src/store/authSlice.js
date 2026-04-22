import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, register as registerApi, getMe as getMeApi } from '../api/authApi';
import { handleThunkError } from '../utils/errorHandler';

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const data = await loginApi(email, password);
            localStorage.setItem('token', data.access_token);
            return data;
        } catch (error) {
            return rejectWithValue(handleThunkError(error, 'Login failed'));
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const data = await registerApi(userData);
            return data;
        } catch (error) {
            return rejectWithValue(handleThunkError(error, 'Registration failed'));
        }
    }
);

export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');

            const profile = await getMeApi();
            return profile;
        } catch (error) {
            localStorage.removeItem('token');
            return rejectWithValue(handleThunkError(error, 'Session expired'));
        }
    }
);

const initialState = {
    token: localStorage.getItem('token'),
    user: null, // Holds id, email, full_name, role
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            state.token = null;
            state.user = null;
            state.status = 'idle';
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(registerUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Registration successful, but no token yet
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Login
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.token = action.payload.access_token;
                // Reset to 'idle' so App.jsx useEffect triggers fetchProfile()
                state.status = 'idle';
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Fetch Profile
            .addCase(fetchProfile.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload; // Set the verified user details (including role)
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.status = 'failed';
                state.token = null;
                state.user = null;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
