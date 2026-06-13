import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import timerReducer from "../slices/timerSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        timer: timerReducer,
    },
});
