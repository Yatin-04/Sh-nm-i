import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserDocuments, deleteDocumentById } from "../services/Operations/documentAPI";
import { colorThemes } from "../utils/colorTheme";

// Icons
const FolderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const FileIcon = ({ type }) => {
    if (type === "application/pdf") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        );
    }
    if (type?.startsWith("image/")) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
};

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const StatusBadge = ({ status }) => {
    const colors = {
        completed: "bg-green-500/15 text-green-400 border-green-500/20",
        processing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
        failed: "bg-red-500/15 text-red-400 border-red-500/20",
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[status] || colors.processing}`}>
            {status}
        </span>
    );
};

export default function MyDocuments() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [deletingId, setDeletingId] = useState(null);

    const themeId = useSelector((state) => state.theme.theme_id);
    const theme = colorThemes.find((t) => t.color_grp === themeId) || colorThemes[0];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await getUserDocuments();
            setSubjects(data || []);
            // Expand all by default
            const expanded = {};
            (data || []).forEach((s) => { expanded[s.subject_id] = true; });
            setExpandedSubjects(expanded);
        } catch (err) {
            console.error(err);
            setError("Couldn't load your documents. Make sure the server is running.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subjectId) => {
        setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Delete this document? Its embeddings will also be removed.")) return;
        setDeletingId(docId);
        try {
            await deleteDocumentById(docId);
            setSubjects((prev) =>
                prev.map((s) => ({
                    ...s,
                    documents: s.documents.filter((d) => d.id !== docId),
                })).filter((s) => s.documents.length > 0)
            );
        } catch (err) {
            console.error(err);
            alert("Failed to delete document.");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
        });
    };

    const totalDocs = subjects.reduce((sum, s) => sum + s.documents.length, 0);

    return (
        <div
            className="ml-16 min-h-screen transition-colors duration-700"
            style={{ backgroundColor: theme.page_bg }}
        >
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/dashboard"
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ color: theme.text_muted }}
                    >
                        <BackIcon />
                    </Link>
                    <div>
                        <h1
                            className="text-2xl font-semibold"
                            style={{ color: theme.text_primary }}
                        >
                            My Documents
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: theme.text_muted }}>
                            {totalDocs} {totalDocs === 1 ? "file" : "files"} across {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div
                            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: theme.accent, borderTopColor: "transparent" }}
                        />
                    </div>
                )}

                {error && (
                    <div
                        className="rounded-xl p-5 text-sm border"
                        style={{ backgroundColor: theme.surface_raised, borderColor: theme.border, color: theme.text_muted }}
                    >
                        {error}
                    </div>
                )}

                {!loading && !error && subjects.length === 0 && (
                    <div
                        className="rounded-xl p-10 text-center border"
                        style={{ backgroundColor: theme.surface_raised, borderColor: theme.border }}
                    >
                        <p className="text-lg mb-2" style={{ color: theme.text_primary }}>
                            No documents yet
                        </p>
                        <p className="text-sm" style={{ color: theme.text_muted }}>
                            Start a Pomodoro session and upload notes through the Study Buddy chat.
                        </p>
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <div className="space-y-4">
                        {subjects.map((subject) => (
                            <div
                                key={subject.subject_id}
                                className="rounded-xl border overflow-hidden transition-colors duration-500"
                                style={{ backgroundColor: theme.surface_raised, borderColor: theme.border }}
                            >
                                {/* Subject folder header */}
                                <button
                                    onClick={() => toggleSubject(subject.subject_id)}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-90 cursor-pointer"
                                    style={{ color: theme.text_primary }}
                                >
                                    <span style={{ color: theme.accent }}><FolderIcon /></span>
                                    <span className="font-medium flex-1">{subject.subject_name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: theme.text_muted, backgroundColor: `${theme.accent}1A` }}>
                                        {subject.documents.length} {subject.documents.length === 1 ? "file" : "files"}
                                    </span>
                                    <svg
                                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        className={`transition-transform duration-200 ${expandedSubjects[subject.subject_id] ? "rotate-180" : ""}`}
                                        style={{ color: theme.text_muted }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {/* Document list */}
                                {expandedSubjects[subject.subject_id] && (
                                    <div className="border-t" style={{ borderColor: theme.border_subtle }}>
                                        {subject.documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-3 px-5 py-3 transition-colors hover:opacity-90 group"
                                                style={{ borderBottom: `1px solid ${theme.border_subtle}` }}
                                            >
                                                <span style={{ color: theme.text_muted }}>
                                                    <FileIcon type={doc.file_type} />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-medium truncate"
                                                        style={{ color: theme.text_primary }}
                                                        title={doc.title}
                                                    >
                                                        {doc.title}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: theme.text_muted }}>
                                                        {formatDate(doc.created_at)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={doc.status} />
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
                                                    style={{ color: theme.text_muted }}
                                                    title="Open file"
                                                >
                                                    <ExternalLinkIcon />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={deletingId === doc.id}
                                                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 text-red-400 disabled:opacity-50 cursor-pointer"
                                                    title="Delete document"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
