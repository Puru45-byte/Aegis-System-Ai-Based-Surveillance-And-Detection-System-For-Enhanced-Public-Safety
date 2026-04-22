import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDashboardStats } from '../api/dashboardApi';
import { handleThunkError } from '../utils/errorHandler';

export const fetchDashboardStats = createAsyncThunk(
    'dashboard/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            return await getDashboardStats();
        } catch (error) {
            return rejectWithValue(handleThunkError(error, 'Failed to load stats'));
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        stats: null,
        status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export default dashboardSlice.reducer;
