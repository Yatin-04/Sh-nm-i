import { createSessionTable } from '../models/session.js'
import { createSubjectTable } from '../models/subject.js'
import { createTodoTable } from '../models/todo.js'
import { createUserTable } from '../models/user.js'

export async function initDB() {
    await createUserTable();
    await createSubjectTable();
    await createTodoTable();
    await createSessionTable();
}