import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    todos: [],
    loading: false,
};

const todoSlice = createSlice({
    name: 'todos',
    initialState,

    reducers: {
        setTodos: (state, action) => {
            state.todos = action.payload;
        },

        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    }
});

export const { setTodos, setLoading } = todoSlice.actions;
export default todoSlice.reducer;