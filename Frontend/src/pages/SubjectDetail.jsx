import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserSubjects } from "../services/Operations/subjectAPI";
import { getUserDocuments, uploadDocument, deleteDocumentById } from "../services/Operations/documentAPI";
import { colorThemes } from "../utils/colorTheme";
import DocumentCardView from "../components/subjects/DocumentCardView";
import DocumentListView from "../components/subjects/DocumentListView";
import DocumentPreviewModal from "../components/subjects/DocumentPreviewModal";
import FlashcardViewer from "../components/FlashcardViewer";
import { FiArrowLeft, FiPlus, FiGrid, FiList, FiAlertCircle } from "react-icons/fi";

const displayFont = { fontFamily: "'Fraunces', Georgia, serif" };

export default function SubjectDetail() {
    const { subjectId } = useParams();
    const [subjectName, setSubjectName] = useState("Subject Notes");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [viewFormat, setViewFormat] = useState("card"); // "card" | "list"
    const [selectedDoc, setSelectedDoc] = useState(null); // for preview modal
    const [flashcardDoc, setFlashcardDoc] = useState(null); // for flashcard modal
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const themeId = useSelector((state) => state.theme.theme_id);
    const theme = colorThemes.find((t) => t.color_grp === themeId) || colorThemes[0];

    useEffect(() => {
        loadData();
    }, [subjectId]);

    useEffect(() => {
        let interval;
        const hasProcessing = documents.some((d) => d.status === "processing");
        if (hasProcessing) {
            interval = setInterval(() => {
                fetchDocumentsSilently();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [documents]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 1. Resolve subject name
            const subjects = await getUserSubjects();
            const currentSubj = subjects.find((s) => s.subject_id === subjectId);
            if (currentSubj) {
                setSubjectName(currentSubj.subject_name);
            }

            // 2. Fetch documents
            await fetchDocuments();
        } catch (err) {
            console.error(err);
            setError("Failed to load subject documents.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        const groupedDocs = await getUserDocuments();
        const group = groupedDocs.find((g) => g.subject_id === subjectId);
        setDocuments(group ? group.documents : []);
    };

    const fetchDocumentsSilently = async () => {
        try {
            const groupedDocs = await getUserDocuments();
            const group = groupedDocs.find((g) => g.subject_id === subjectId);
            if (group) {
                setDocuments(group.documents);
            }
        } catch (err) {
            console.error("Silent reload failed:", err);
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            await uploadDocument(subjectId, file);
            // Refresh list immediately
            await fetchDocuments();
        } catch (err) {
            console.error(err);
            setError(err?.data?.error || "Failed to upload document. Maximum file size is 10MB.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset
            }
        }
    };

    const handleDeleteDoc = async (docId) => {
        if (!window.confirm("Delete this document? Its database chunks and embeddings will be removed permanently.")) return;
        
        setDeletingId(docId);
        try {
            await deleteDocumentById(docId);
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete document.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div
            className="ml-16 min-h-screen transition-colors duration-700"
            style={{ backgroundColor: theme.page_bg }}
        >
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b" style={{ borderColor: theme.border_subtle }}>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/subjects"
                            className="p-2 rounded-lg transition-colors hover:opacity-80 flex items-center justify-center border"
                            style={{ borderColor: theme.border, color: theme.text_muted, backgroundColor: theme.surface_raised }}
                        >
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1
                                className="text-3xl"
                                style={{ ...displayFont, color: theme.text_primary }}
                            >
                                {subjectName}
                            </h1>
                            <p className="text-sm mt-0.5" style={{ color: theme.text_muted }}>
                                {documents.length} {documents.length === 1 ? "document" : "documents"} uploaded
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Toggle switch for Card vs List view */}
                        <div 
                            className="flex items-center p-1 rounded-sm border shrink-0"
                            style={{ backgroundColor: theme.surface_raised, borderColor: theme.border }}
                        >
                            <button
                                onClick={() => setViewFormat("card")}
                                className="p-1.5 rounded-xs transition-all cursor-pointer flex items-center justify-center"
                                style={{ 
                                    backgroundColor: viewFormat === "card" ? theme.accent : "transparent",
                                    color: viewFormat === "card" ? (theme.button_text || "#fff") : theme.text_muted
                                }}
                                title="Card format"
                            >
                                <FiGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewFormat("list")}
                                className="p-1.5 rounded-xs transition-all cursor-pointer flex items-center justify-center"
                                style={{ 
                                    backgroundColor: viewFormat === "list" ? theme.accent : "transparent",
                                    color: viewFormat === "list" ? (theme.button_text || "#fff") : theme.text_muted
                                }}
                                title="List format"
                            >
                                <FiList size={16} />
                            </button>
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf, .txt, image/*"
                            className="hidden"
                        />

                        {/* Add Document button */}
                        <button
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
                            style={{ 
                                backgroundColor: theme.accent, 
                                color: theme.button_text || "#ffffff",
                                boxShadow: `0 4px 14px ${theme.accent}3d`
                            }}
                        >
                            <FiPlus size={18} />
                            <span>{uploading ? "Uploading..." : "Add Document"}</span>
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div
                        className="rounded-xl p-4 text-sm border flex items-center gap-3 mb-8"
                        style={{ backgroundColor: theme.surface_raised, borderColor: theme.border, color: theme.text_muted }}
                    >
                        <FiAlertCircle size={18} className="shrink-0 text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Main Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div
                            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: theme.accent, borderTopColor: "transparent" }}
                        />
                    </div>
                ) : documents.length === 0 ? (
                    <div 
                        className="border rounded-2xl p-16 text-center flex flex-col items-center justify-center"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                        <h3 className="text-lg font-medium mb-1" style={{ color: theme.text_primary }}>
                            No documents in this subject
                        </h3>
                        <p className="text-sm max-w-sm mb-6" style={{ color: theme.text_muted }}>
                            Upload notes, textbooks, or essays (PDFs, TXT files, or images) to start querying them with your Study Buddy.
                        </p>
                        <button
                            onClick={handleUploadClick}
                            className="px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
                            style={{ backgroundColor: theme.accent, color: theme.button_text || "#fff" }}
                        >
                            <FiPlus size={18} />
                            <span>Upload Document</span>
                        </button>
                    </div>
                ) : viewFormat === "card" ? (
                    <DocumentCardView 
                        documents={documents}
                        theme={theme}
                        onPreview={setSelectedDoc}
                        onFlashcard={setFlashcardDoc}
                        onDelete={handleDeleteDoc}
                        deletingId={deletingId}
                    />
                ) : (
                    <DocumentListView 
                        documents={documents}
                        theme={theme}
                        onPreview={setSelectedDoc}
                        onFlashcard={setFlashcardDoc}
                        onDelete={handleDeleteDoc}
                        deletingId={deletingId}
                    />
                )}
            </div>

            {/* Document Preview Modal */}
            {selectedDoc && (
                <DocumentPreviewModal 
                    document={selectedDoc}
                    subjectId={subjectId}
                    onClose={() => setSelectedDoc(null)}
                    theme={theme}
                />
            )}

            {/* Document Flashcard Viewer */}
            {flashcardDoc && (
                <FlashcardViewer
                    subjectId={subjectId}
                    documentId={flashcardDoc.id}
                    documentTitle={flashcardDoc.title}
                    onClose={() => setFlashcardDoc(null)}
                    theme={theme}
                />
            )}
        </div>
    );
}
