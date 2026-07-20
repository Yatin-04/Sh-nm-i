import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
    getUserTodos,
    createTodo,
    completeTodo,
    deleteTodo,
} from "../../services/Operations/todoAPI";
import { fetchCurrentStreak } from "../../services/Operations/analyticsAPI";
import { FiCheck, FiX, FiPlus } from "react-icons/fi";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Return "YYYY-MM-DD" for a Date object in local time */
function localDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

/** Build the 8 day objects: [today-6 … today, tomorrow] */
function buildDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push({
            date: localDateStr(d),
            jsDate: d,
            isToday: i === 0,
            isUpcoming: false,
            isPast: i > 0,
        });
    }

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    days.push({
        date: localDateStr(tomorrow),
        jsDate: tomorrow,
        isToday: false,
        isUpcoming: true,
        isPast: false,
    });

    return days;
}

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Purple heat shade based on count (0–4+) */
function heatBg(count, isSelected) {
    if (isSelected) return "bg-[#2D1B4E] text-white border-[#2D1B4E]";
    if (count === 0) return "bg-black/[0.04] text-[#4A3B69]/60 border-[#2D1B4E]/10 hover:border-[#2D1B4E]/30";
    if (count === 1) return "bg-[#2D1B4E]/10 text-[#2D1B4E]/80 border-[#2D1B4E]/20 hover:border-[#2D1B4E]/40";
    if (count === 2) return "bg-[#2D1B4E]/20 text-[#2D1B4E]/90 border-[#2D1B4E]/30 hover:border-[#2D1B4E]/50";
    if (count === 3) return "bg-[#2D1B4E]/35 text-[#2D1B4E] border-[#2D1B4E]/40 hover:border-[#2D1B4E]/60";
    return "bg-[#2D1B4E]/55 text-white border-[#2D1B4E]/60 hover:border-[#2D1B4E]/80";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const CheckCircle = ({ checked, onClick }) => (
    <button
        onClick={onClick}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 ${
            checked
                ? "bg-[#2D1B4E] border-[#2D1B4E]"
                : "border-[#2D1B4E]/30 hover:border-[#2D1B4E]/60 hover:bg-[#2D1B4E]/5"
        }`}
    >
        {checked && <FiCheck size={10} color="white" />}
    </button>
);

const DeleteBtn = ({ onClick }) => (
    <button
        onClick={onClick}
        className="w-5 h-5 rounded-full border border-red-300/60 flex items-center justify-center text-red-400/70 hover:text-red-500 hover:border-red-400 hover:bg-red-50 transition-all duration-200 cursor-pointer flex-shrink-0"
        title="Delete task"
    >
        <FiX size={10} />
    </button>
);

// ─── AddTask inline input ─────────────────────────────────────────────────────

function AddTaskInput({ onAdd, onCancel, creating }) {
    const [val, setVal] = useState("");
    return (
        <div className="flex gap-2 mt-1 mb-2">
            <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onAdd(val);
                    if (e.key === "Escape") onCancel();
                }}
                placeholder="What needs doing?"
                autoFocus
                className="flex-1 bg-black/[0.06] border border-[#2D1B4E]/10 rounded-lg px-3 py-2 text-sm text-[#2D1B4E] placeholder-[#4A3B69]/40 focus:outline-none focus:border-[#2D1B4E]/30 transition-colors"
            />
            <button
                onClick={() => onAdd(val)}
                disabled={creating || !val.trim()}
                className="px-3 py-2 bg-[#2D1B4E] text-white text-xs rounded-lg disabled:opacity-40 hover:bg-[#3d2866] transition-colors cursor-pointer"
            >
                {creating ? "…" : "Add"}
            </button>
            <button
                onClick={onCancel}
                className="px-2 py-2 text-[#4A3B69]/60 text-xs hover:text-[#2D1B4E] transition-colors cursor-pointer"
            >
                ✕
            </button>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TodoPanel() {
    const dispatch = useDispatch();
    const DAYS = buildDays(); // stable across renders since it's pure
    const todayStr = localDateStr(new Date());

    const [allTodos, setAllTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [sessionCompleted, setSessionCompleted] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch all todos on mount
    useEffect(() => {
        (async () => {
            try {
                const todos = await getUserTodos();
                setAllTodos(todos ?? []);
            } catch {
                // silent fail
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Close add input when switching days
    useEffect(() => {
        setShowInput(false);
    }, [selectedDate]);

    // Derived values
    const selectedDay = DAYS.find((d) => d.date === selectedDate) ?? DAYS[6]; // fallback to today
    const canAdd     = selectedDay.isToday || selectedDay.isUpcoming;
    const canComplete = selectedDay.isToday;
    const canDelete   = selectedDay.isUpcoming;

    const visibleTodos = allTodos.filter(
        (t) => t.todo_date && localDateStr(new Date(t.todo_date)) === selectedDate && !t.status
    );

    // Count todos per day for heat-map
    const countByDate = useCallback(
        (dateStr) => allTodos.filter((t) => t.todo_date && localDateStr(new Date(t.todo_date)) === dateStr).length,
        [allTodos]
    );

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleCreate = async (task) => {
        const trimmed = task.trim();
        if (!trimmed) return;
        setCreating(true);
        try {
            const todo = await createTodo(trimmed, selectedDate);
            setAllTodos((prev) => [todo, ...prev]);
            setShowInput(false);
        } catch {
            // silent fail
        } finally {
            setCreating(false);
        }
    };

    const handleComplete = async (todoId) => {
        try {
            const completed = await completeTodo(todoId);
            await fetchCurrentStreak(dispatch);
            setAllTodos((prev) => prev.filter((t) => t.todo_id !== todoId));
            setSessionCompleted((prev) => [completed, ...prev]);
        } catch (e) {
            console.error("Complete todo error:", e);
        }
    };

    const handleDelete = async (todoId) => {
        try {
            await deleteTodo(todoId);
            setAllTodos((prev) => prev.filter((t) => t.todo_id !== todoId));
        } catch (e) {
            console.error("Delete todo error:", e);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <p className="text-xs text-[#4A3B69]">Loading tasks…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <p className="text-xs text-[#2D1B4E] uppercase tracking-widest mb-2 font-medium">
                Todo
            </p>

            {/* ── Day label ── */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#2D1B4E]/70">
                    {selectedDay.isToday
                        ? "Today"
                        : selectedDay.isUpcoming
                        ? "Tomorrow"
                        : selectedDay.jsDate.toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                          })}
                </span>
                {canAdd && !showInput && (
                    <button
                        onClick={() => setShowInput(true)}
                        className="flex items-center gap-1 text-[10px] text-[#2D1B4E]/60 hover:text-[#2D1B4E] transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-[#2D1B4E]/5"
                    >
                        <FiPlus size={11} />
                        Add Task
                    </button>
                )}
            </div>

            {/* ── Add task input ── */}
            {showInput && (
                <AddTaskInput
                    onAdd={handleCreate}
                    onCancel={() => setShowInput(false)}
                    creating={creating}
                />
            )}

            {/* ── Todo list ── */}
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0">
                {visibleTodos.length === 0 && !showInput && (
                    <p className="text-xs text-[#4A3B69]/50 py-3 text-center">
                        {selectedDay.isPast
                            ? "No tasks recorded for this day."
                            : "No tasks yet."}
                    </p>
                )}

                {visibleTodos.map((todo) => (
                    <div
                        key={todo.todo_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.06] border border-[#2D1B4E]/5 transition-all duration-200"
                    >
                        {/* Complete checkbox — today only */}
                        {canComplete ? (
                            <CheckCircle
                                checked={false}
                                onClick={() => handleComplete(todo.todo_id)}
                            />
                        ) : (
                            /* Decorative dot for past / upcoming */
                            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2D1B4E]/25" />
                            </span>
                        )}

                        <span className="flex-1 text-sm text-[#2D1B4E] truncate">
                            {todo.task}
                        </span>

                        {/* Delete button — upcoming only */}
                        {canDelete && (
                            <DeleteBtn onClick={() => handleDelete(todo.todo_id)} />
                        )}
                    </div>
                ))}

                {/* ── Session completed (today only) ── */}
                {canComplete && sessionCompleted.length > 0 && (
                    <div className="border-t border-[#2D1B4E]/8 pt-2 mt-1">
                        <p className="text-[10px] text-[#4A3B69]/45 uppercase tracking-widest mb-1.5">
                            Completed
                        </p>
                        <div className="flex flex-col gap-1">
                            {sessionCompleted.map((todo) => (
                                <div
                                    key={todo.todo_id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50"
                                >
                                    <CheckCircle checked={true} onClick={() => {}} />
                                    <span className="flex-1 text-sm text-[#2D1B4E] line-through truncate">
                                        {todo.task}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Heatmap day-navigator strip ── */}
            <div className="mt-3 pt-3 border-t border-[#2D1B4E]/10">
                <p className="text-[9px] text-[#4A3B69]/40 uppercase tracking-widest mb-2">
                    Select Day
                </p>
                <div className="grid grid-cols-8 gap-1">
                    {DAYS.map((day) => {
                        const count = countByDate(day.date);
                        const isSelected = day.date === selectedDate;
                        const heatClass = heatBg(count, isSelected);
                        const dayObj = day.jsDate;

                        return (
                            <button
                                key={day.date}
                                onClick={() => setSelectedDate(day.date)}
                                title={dayObj.toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                                className={`
                                    flex flex-col items-center justify-center
                                    rounded-lg border py-1.5 gap-0.5
                                    transition-all duration-200 cursor-pointer
                                    ${day.isUpcoming ? "border-dashed" : ""}
                                    ${heatClass}
                                `}
                            >
                                <span className="text-[9px] font-semibold leading-none opacity-70">
                                    {day.isUpcoming ? "↑" : DAY_ABBR[dayObj.getDay()]}
                                </span>
                                <span className="text-[11px] font-bold leading-none">
                                    {dayObj.getDate()}
                                </span>
                                {/* Heat dot */}
                                {count > 0 && !isSelected && (
                                    <span
                                        className="w-1 h-1 rounded-full bg-[#2D1B4E]/50 mt-0.5"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
