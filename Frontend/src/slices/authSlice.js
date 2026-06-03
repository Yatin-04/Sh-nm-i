import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
    user_id: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth(state, action) {
            state.isAuthenticated = true;
            state.user_id = action.payload.user_id;
        },
        clearAuth(state) {
            state.isAuthenticated = false;
            state.user_id = null;
        },
    },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;