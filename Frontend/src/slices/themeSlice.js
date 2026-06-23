import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    theme_id: 3,
};

const themeSlice = createSlice({
    name: "theme",
    initialState,

    reducers: {
        setTheme(state, action) {
            state.theme_id = action.payload;
        }
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;