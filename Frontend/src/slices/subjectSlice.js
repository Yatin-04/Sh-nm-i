import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    subjects: [],
    loading: false,
};

const subjectSlice = createSlice({
    name: 'subjects',
    initialState,
    // Wrap actions inside the reducers object
    reducers: {
        setSubjects: (state, action) => {
            state.subjects = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    }
}); 

export const { setSubjects, setLoading } = subjectSlice.actions;
export default subjectSlice.reducer;