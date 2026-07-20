import { apiConnector } from "../apiConnector";
import { todoEndpoints } from "../api";

// GET /todos/ → { todos: [...] }
export async function getUserTodos() {
    try {
        const data = await apiConnector("GET", todoEndpoints.GET_USER_TODOS_API);
        return data.todos;
    } catch (error) {
        console.error("GET TODOS ERROR:", error);
        throw error;
    }
}

// POST /todos/ → { message, todo: { ... } }
export async function createTodo(task, date) {
    try {
        const data = await apiConnector("POST", todoEndpoints.CREATE_USER_TODOS_API, {
            task,
            date,
        });

        // console.log("CREATE TODO API RESPONSE:", data);
        return data.todo;
    } catch (error) {
        console.error("CREATE TODO ERROR:", error);
        throw error;
    }
}

// PUT /todos/:todo_id/complete → { todo: { ... } }
export async function completeTodo(todoId , ) {
    try {
        const url = todoEndpoints.COMPLETE_USER_TODOS_API.replace(":todo_id", todoId);
        const data = await apiConnector("PUT", url);
        // console.log("COMPLETE TODO API RESPONSE:", data);

        return data.todo;
    } catch (error) {
        console.error("COMPLETE TODO ERROR:", error);
        throw error;
    }
}
// DELETE /todos/:todo_id → { message, todo }
export async function deleteTodo(todoId) {
    try {
        const url = todoEndpoints.DELETE_USER_TODOS_API.replace(":todo_id", todoId);
        const data = await apiConnector("DELETE", url);
        return data.todo;
    } catch (error) {
        console.error("DELETE TODO ERROR:", error);
        throw error;
    }
}
