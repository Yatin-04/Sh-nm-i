# Todo Panel — Heatmap Day Navigator

## Overview

Modify the `TodoPanel` to feature an 8-box day-navigator at the bottom. Seven boxes represent the last 7 days (including today), and the 8th box represents **tomorrow** (the upcoming day). Clicking a box filters the visible todos to that day. Add/complete/delete permissions are day-specific.

---

## Permission Matrix

| Action        | Today | Past Days | Tomorrow (Upcoming) |
|---------------|-------|-----------|---------------------|
| Add Todo      | ✅    | ❌        | ✅                  |
| Complete Todo | ✅    | ❌        | ❌                  |
| Delete Todo   | ❌    | ❌        | ✅                  |

---

## Proposed Changes

### Backend — Add Delete Endpoint

#### [MODIFY] [todo.js (model)](file:///d:/megaProject/Sh-nm-i/Server/src/models/todo.js)
- Add `deleteTodo(todoId, userId)` function using `DELETE FROM todos WHERE todo_id = $1 AND user_id = $2`.

#### [MODIFY] [Todo.js (controller)](file:///d:/megaProject/Sh-nm-i/Server/src/controllers/Todo.js)
- Add `deleteTodo` controller that calls the model and returns 200 on success.

#### [MODIFY] [Todo.js (routes)](file:///d:/megaProject/Sh-nm-i/Server/src/routes/Todo.js)
- Register `router.delete('/:todo_id', deleteTodo)`.

---

### Frontend — API Layer

#### [MODIFY] [api.js](file:///d:/megaProject/Sh-nm-i/Frontend/src/services/api.js)
- Add `DELETE_USER_TODOS_API: BASE_URL + "/todos/:todo_id"`.

#### [MODIFY] [todoAPI.js](file:///d:/megaProject/Sh-nm-i/Frontend/src/services/Operations/todoAPI.js)
- Add `deleteTodo(todoId)` function that calls `DELETE /todos/:todo_id`.

---

### Frontend — TodoPanel UI

#### [MODIFY] [TodoPanel.jsx](file:///d:/megaProject/Sh-nm-i/Frontend/src/components/todo/TodoPanel.jsx)

**State:**
- `allTodos` — all fetched todos (flat array)
- `selectedDate` — currently active day string (`YYYY-MM-DD`), defaults to today
- `sessionCompletedTodos` — todos completed this session

**Day Generation Logic:**
- Compute an array of 8 day objects: indices 0–6 = last 7 days (oldest → today), index 7 = tomorrow
- Each object has `{ date, label, isToday, isUpcoming }`

**Heatmap Boxes (bottom strip):**
- 8 boxes arranged horizontally at the bottom of the panel
- Each box shows: 2-letter day abbreviation + date number
- **Heat indicator**: shade the box based on how many todos exist for that day (0 = lightest, ≥3 = darkest purple)
- Selected box gets a highlighted border/background
- Tomorrow box is visually distinct (dashed border or lighter tone)

**Todo List (top/main area):**
- Filters `allTodos` by `selectedDate`
- Shows empty state if no todos

**Conditional UI per selected day:**
- `isToday || isUpcoming` → show **+ Add Task** button
- `isToday` only → show **CheckCircle** (complete button) on each todo
- `isUpcoming` only → show **Delete (✕)** button on each todo
- Past days → todos are read-only (no action buttons)

**Completed tasks section:**
- Only appears when viewing today; shows `sessionCompletedTodos` (todos completed this session)

## Verification Plan

### Manual Verification
- Select each of the 8 day boxes and verify correct todos appear
- Verify Add button only appears on Today and Tomorrow
- Verify complete checkbox only appears on Today's todos
- Verify delete button only appears on Tomorrow's todos
- Verify past-day todos are read-only
- Verify heat color intensity changes based on todo count
