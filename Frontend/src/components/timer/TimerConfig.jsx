import { useState, useEffect } from "react";
import { getUserSubjects, createSubject } from "../../services/Operations/subjectAPI";

export default function TimerConfig({ focusDuration, breakDuration, onSave, onClose, theme }) {
    const [focusMin, setFocusMin] = useState(String(Math.floor(focusDuration / 60)));
    const [breakMin, setBreakMin] = useState(String(Math.floor(breakDuration / 60)));

    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [newSubjectName, setNewSubjectName] = useState("");
    const [creatingSubject, setCreatingSubject] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await getUserSubjects();
                setSubjects(data);
                if (data.length > 0) setSelectedSubjectId(data[0].subject_id);
            } catch {
                setError("Couldn't load subjects.");
            } finally {
                setLoadingSubjects(false);
            }
        })();
    }, []);

    const handleCreateSubject = async () => {
        if (!newSubjectName.trim()) return;
        setCreatingSubject(true);
        setError(null);
        try {
            const subject = await createSubject(newSubjectName.trim());
            setSubjects((prev) => [subject, ...prev]);
            setSelectedSubjectId(subject.subject_id);
            setNewSubjectName("");
        } catch {
            setError("Couldn't create subject.");
        } finally {
            setCreatingSubject(false);
        }
    };

    const handleSave = () => {
        if (!selectedSubjectId) {
            setError("Pick or create a subject first.");
            return;
        }
        const subject = subjects.find((s) => s.subject_id === selectedSubjectId);
        const parsedFocus = parseInt(focusMin, 10) || 1;
        const parsedBreak = parseInt(breakMin, 10) || 1;
        onSave({
            focusDuration: Math.max(1, parsedFocus) * 60,
            breakDuration: Math.max(1, parsedBreak) * 60,
            subjectId: selectedSubjectId,
            subjectName: subject?.subject_name ?? "Unnamed",
        });
    };

    // Inject dynamic hover and focus styles
    const dynamicStyles = theme ? `
        .theme-input {
            background-color: ${theme.page_bg};
            border-color: ${theme.border};
            color: ${theme.text_primary};
        }
        .theme-input:focus {
            border-color: ${theme.accent};
            box-shadow: 0 0 0 3px ${theme.accent}33;
        }
        .theme-input::placeholder { color: ${theme.text_muted}; }
        
        .theme-btn-secondary {
            background-color: ${theme.page_bg};
            border-color: ${theme.border};
            color: ${theme.text_secondary};
        }
        .theme-btn-secondary:hover:not(:disabled) {
            background-color: ${theme.border_subtle};
            color: ${theme.text_primary};
        }
        
        .theme-btn-cancel {
            border-color: ${theme.border};
            color: ${theme.text_secondary};
        }
        .theme-btn-cancel:hover {
            background-color: ${theme.panel_pill_hover_bg};
            color: ${theme.text_primary};
        }
        
        .theme-btn-primary {
            background-color: ${theme.button_bg};
            color: ${theme.button_text};
            border-color: transparent;
        }
        .theme-btn-primary:hover {
            background-color: ${theme.button_hover_bg};
        }
    ` : '';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-default"
            onClick={onClose}
        >
            {theme && <style>{dynamicStyles}</style>}

            <div
                className="rounded-2xl p-8 w-full max-w-md shadow-2xl border transition-colors duration-500"
                style={{ 
                    backgroundColor: theme?.surface_raised || '#fff', 
                    borderColor: theme?.border || '#eee' 
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 
                    className="font-semibold text-xl mb-6"
                    style={{ color: theme?.text_primary }}
                >
                    Configure Session
                </h2>

                {/* Duration inputs */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1">
                        <label 
                            className="text-xs uppercase tracking-widest block mb-2 font-medium"
                            style={{ color: theme?.text_secondary }}
                        >
                            Focus (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={focusMin}
                            onChange={(e) => setFocusMin(e.target.value.replace(/^0+(?=\d)/, ""))}
                            className="theme-input w-full border rounded-lg px-4 py-3 text-2xl text-center font-medium focus:outline-none transition-all cursor-text"
                        />
                    </div>
                    <div className="flex-1">
                        <label 
                            className="text-xs uppercase tracking-widest block mb-2 font-medium"
                            style={{ color: theme?.text_secondary }}
                        >
                            Break (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={60}
                            value={breakMin}
                            onChange={(e) => setBreakMin(e.target.value.replace(/^0+(?=\d)/, ""))}
                            className="theme-input w-full border rounded-lg px-4 py-3 text-2xl text-center font-medium focus:outline-none transition-all cursor-text"
                        />
                    </div>
                </div>

                {/* Subject selector */}
                <div className="mb-4">
                    <label 
                        className="text-xs uppercase tracking-widest block mb-2 font-medium"
                        style={{ color: theme?.text_secondary }}
                    >
                        Subject
                    </label>
                    {loadingSubjects ? (
                        <p className="text-sm" style={{ color: theme?.text_muted }}>Loading subjects...</p>
                    ) : (
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="theme-input w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                            {subjects.length === 0 && (
                                <option value="" disabled>No subjects yet</option>
                            )}
                            {subjects.map((s) => (
                                <option 
                                    key={s.subject_id} 
                                    value={s.subject_id}
                                    style={{ backgroundColor: theme?.surface_raised, color: theme?.text_primary }}
                                >
                                    {s.subject_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Create new subject */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="New subject..."
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateSubject()}
                        className="theme-input flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all cursor-text"
                    />
                    <button
                        onClick={handleCreateSubject}
                        disabled={creatingSubject || !newSubjectName.trim()}
                        className="theme-btn-secondary px-4 py-2.5 border disabled:opacity-50 text-sm rounded-lg transition-colors cursor-pointer font-medium"
                    >
                        {creatingSubject ? "..." : "+ Add"}
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-xs mb-4 font-medium">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="theme-btn-cancel flex-1 py-3 border text-sm rounded-lg transition-colors cursor-pointer font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="theme-btn-primary flex-1 py-3 text-sm rounded-lg transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 cursor-pointer font-medium tracking-wide"
                    >
                        Start Session →
                    </button>
                </div>
            </div>
        </div>
    );
}