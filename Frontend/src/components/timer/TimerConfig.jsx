import { useState, useEffect } from "react";
import { getUserSubjects, createSubject } from "../../services/Operations/subjectAPI";

export default function TimerConfig({ focusDuration, breakDuration, onSave, onClose }) {
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-default"
            onClick={onClose}
        >
            <div
                className="rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/10"
                style={{ backgroundColor: "rgba(45, 27, 78, 0.95)", backdropFilter: "blur(12px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-white font-semibold text-lg mb-6">Configure Session</h2>

                {/* Duration inputs */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1">
                        <label className="text-[#EAE0F8] text-xs uppercase tracking-widest block mb-2 font-medium">
                            Focus (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={focusMin}
                            onChange={(e) => setFocusMin(e.target.value.replace(/^0+(?=\d)/, ""))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-2xl text-center font-medium focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all cursor-text"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[#EAE0F8] text-xs uppercase tracking-widest block mb-2 font-medium">
                            Break (min)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={60}
                            value={breakMin}
                            onChange={(e) => setBreakMin(e.target.value.replace(/^0+(?=\d)/, ""))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-2xl text-center font-medium focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all cursor-text"
                        />
                    </div>
                </div>

                {/* Subject selector */}
                <div className="mb-4">
                    <label className="text-[#EAE0F8] text-xs uppercase tracking-widest block mb-2 font-medium">
                        Subject
                    </label>
                    {loadingSubjects ? (
                        <p className="text-white/70 text-sm">Loading subjects...</p>
                    ) : (
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all appearance-none cursor-pointer"
                        >
                            {subjects.length === 0 && (
                                <option value="" disabled>No subjects yet</option>
                            )}
                            {subjects.map((s) => (
                                <option key={s.subject_id} value={s.subject_id} className="bg-[#2D1B4E] text-white">
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
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all cursor-text"
                    />
                    <button
                        onClick={handleCreateSubject}
                        disabled={creatingSubject || !newSubjectName.trim()}
                        className="px-4 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-30 text-white/70 hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
                    >
                        {creatingSubject ? "..." : "+ Add"}
                    </button>
                </div>

                {error && (
                    <p className="text-red-300 text-xs mb-4">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-white/15 text-white/70 hover:text-white hover:bg-white/5 text-sm rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-[#2D1B4E] hover:bg-[#3d2866] text-white text-sm rounded-lg transition-all shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 border border-white/10 cursor-pointer"
                    >
                        Start Session →
                    </button>
                </div>
            </div>
        </div>
    );
}
