import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import timerReducer from "../slices/timerSlice";
import themeReducer from "../slices/themeSlice"; // Import the theme reducer
import streakReducer from "../slices/streakSlice"; // Import the streak reducer

export const store = configureStore({
    reducer: {
        auth: authReducer,
        timer: timerReducer,
        theme: themeReducer, // Add the theme reducer here
        streak: streakReducer, // Add the streak reducer here
    },
});
