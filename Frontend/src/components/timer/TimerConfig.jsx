import { useState, useEffect } from "react";
import { getUserSubjects, createSubject } from "../../services/Operations/subjectAPI";

// Props:
//   focusDuration  - current config in seconds
//   breakDuration  - current config in seconds
//   onSave({ focusDuration, breakDuration, subjectId, subjectName })
//   onClose()

export default function TimerConfig({ focusDuration, breakDuration, onSave, onClose }) {
    const [focusMin, setFocusMin] = useState(Math.floor(focusDuration / 60));
    const [breakMin, setBreakMin] = useState(Math.floor(breakDuration / 60));

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
        onSave({
            focusDuration: Math.max(1, focusMin) * 60,
            breakDuration: Math.max(1, breakMin) * 60,
            subjectId: selectedSubjectId,
            subjectName: subject?.subject_name ?? "Unnamed",
        });
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal */}
            <div
                className="bg-[#141417] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-white font-mono text-lg mb-6 tracking-tight">configure session</h2>

                {/* Duration inputs */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1">
                        <label className="text-white/40 font-mono text-xs uppercase tracking-widest block mb-2">
                            focus (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={focusMin}
                            onChange={(e) => setFocusMin(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-2xl text-center focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-white/40 font-mono text-xs uppercase tracking-widest block mb-2">
                            break (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={60}
                            value={breakMin}
                            onChange={(e) => setBreakMin(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-2xl text-center focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                </div>

                {/* Subject selector */}
                <div className="mb-4">
                    <label className="text-white/40 font-mono text-xs uppercase tracking-widest block mb-2">
                        subject
                    </label>
                    {loadingSubjects ? (
                        <p className="text-white/30 font-mono text-sm">loading subjects...</p>
                    ) : (
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
                        >
                            {subjects.length === 0 && (
                                <option value="" disabled>no subjects yet</option>
                            )}
                            {subjects.map((s) => (
                                <option key={s.subject_id} value={s.subject_id} className="bg-[#141417]">
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
                        placeholder="new subject..."
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateSubject()}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                        onClick={handleCreateSubject}
                        disabled={creatingSubject || !newSubjectName.trim()}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white font-mono text-sm rounded-lg transition-colors"
                    >
                        {creatingSubject ? "..." : "+ add"}
                    </button>
                </div>

                {error && (
                    <p className="text-red-400 font-mono text-xs mb-4">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-white/10 text-white/50 hover:text-white/80 font-mono text-sm rounded-lg transition-colors"
                    >
                        cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-white text-black font-mono text-sm rounded-lg hover:bg-white/90 transition-colors"
                    >
                        start session →
                    </button>
                </div>
            </div>
        </div>
    );
}
