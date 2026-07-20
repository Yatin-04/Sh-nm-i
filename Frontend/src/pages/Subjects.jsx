import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserSubjects, createSubject, deleteSubject } from "../services/Operations/subjectAPI";
import { colorThemes } from "../utils/colorTheme";
import SubjectCard from "../components/subjects/SubjectCard";
import { FiPlus, FiBookOpen, FiArrowLeft, FiAlertCircle } from "react-icons/fi";

const displayFont = { fontFamily: "'Fraunces', Georgia, serif" };

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const themeId = useSelector((state) => state.theme.theme_id);
    const theme = colorThemes.find((t) => t.color_grp === themeId) || colorThemes[0];

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleDeleteSubject = async (subjectId) => {
        if (!window.confirm("Are you sure you want to delete this subject? All documents within it will also be deleted.")) {
            return;
        }

        setDeletingId(subjectId);
        try {
            await deleteSubject(subjectId);
            setSubjects((prev) => prev.filter((s) => s.subject_id !== subjectId));
        } catch (err) {
            console.error("Failed to delete subject:", err);
            setError(err?.data?.error || "Failed to delete subject. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserSubjects();
            setSubjects(data || []);
        } catch (err) {
            console.error(err);
            setError("Could not load subjects. Make sure the server is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        const trimmed = newSubjectName.trim();
        if (!trimmed) return;

        setCreating(true);
        setError(null);
        try {
            const subject = await createSubject(trimmed);
            setSubjects((prev) => [subject, ...prev]);
            setNewSubjectName("");
            setShowAddForm(false);
        } catch (err) {
            console.error(err);
            setError("Failed to create subject. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div
            className="ml-16 min-h-screen transition-colors duration-700"
            style={{ backgroundColor: theme.page_bg }}
        >
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-5 mb-5 border-b"
                    style={{ borderColor: theme.border }}
                >
                    <div className="flex items-center gap-4">
                        <div>
                            <h1
                                className="text-3xl"
                                style={{ ...displayFont, color: theme.text_primary }}
                            >
                                Subjects
                            </h1>
                            <p className="text-sm mt-0.5" style={{ color: theme.text_muted || theme.text_secondary }}>
                                Organize your classes, projects, and focus databases
                            </p>
                        </div>
                    </div>

                    {/* Add Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-4 py-2.5 rounded-sm flex items-center justify-center gap-2 font-medium transition-all active:scale-95 cursor-pointer shadow-lg"
                            style={{ 
                                backgroundColor: theme.accent, 
                                color: theme.button_text || "#ffffff",
                                boxShadow: `0 4px 14px ${theme.accent}3d`
                            }}
                        >
                            <FiPlus size={18} />
                            <span>Add Subject</span>
                        </button>
                    )}
                </div>

                {/* Inline Add Subject Form */}
                {showAddForm && (
                    <form 
                        onSubmit={handleCreateSubject}
                        className="mb-8 p-5 border rounded-xs animate-in fade-in slide-in-from-top-3 duration-200"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                        <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text_primary }}>
                            Create New Subject
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="e.g., Quantum Physics, Web Development"
                                disabled={creating}
                                className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors border"
                                style={{ 
                                    backgroundColor: theme.page_bg, 
                                    borderColor: theme.border, 
                                    color: theme.text_primary 
                                }}
                            />
                            <div className="flex gap-2 shrink-0">
                                <button
                                    type="submit"
                                    disabled={creating || !newSubjectName.trim()}
                                    className="px-5 py-2.5 rounded-md text-xs font-medium transition-all hover: cursor-pointer disabled:opacity-50"
                                    style={{ backgroundColor: theme.accent, color: theme.button_text || "#fff" }}
                                >
                                    {creating ? "Creating..." : "Create"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddForm(false); setNewSubjectName(""); }}
                                    className="px-4 py-2.5 border rounded-md text-sm font-medium transition-colors hover:bg-black/5 cursor-pointer"
                                    style={{ borderColor: theme.border, color: theme.text_muted }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Error Alert */}
                {error && (
                    <div
                        className="rounded-xl p-4 text-sm border flex items-center gap-3 mb-8"
                        style={{ backgroundColor: theme.surface_raised, borderColor: theme.border, color: theme.text_muted }}
                    >
                        <FiAlertCircle size={18} className="shrink-0" style={{ color: theme.accent_3 || "red" }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div
                            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: theme.accent, borderTopColor: "transparent" }}
                        />
                    </div>
                ) : subjects.length === 0 ? (
                    <div 
                        className="border rounded-2xl p-16 text-center flex flex-col items-center justify-center"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-dashed"
                            style={{ borderColor: theme.border, color: theme.text_muted }}
                        >
                            <FiBookOpen size={28} />
                        </div>
                        <h3 className="text-lg font-medium mb-1" style={{ color: theme.text_primary }}>
                            No subjects created yet
                        </h3>
                        <p className="text-sm max-w-sm mb-6" style={{ color: theme.text_muted }}>
                            Get started by creating a subject folder. You will be able to track studies, store documents, and ask AI questions.
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
                            style={{ backgroundColor: theme.accent, color: theme.button_text || "#fff" }}
                        >
                            <FiPlus size={18} />
                            <span>Create Your First Subject</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {subjects.map((subj) => (
                            <SubjectCard 
                                key={subj.subject_id} 
                                subject={subj} 
                                theme={theme}
                                onDelete={handleDeleteSubject}
                                deletingId={deletingId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
