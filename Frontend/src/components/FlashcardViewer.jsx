import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFlashcards } from "../services/Operations/documentAPI";
import { FiX } from "react-icons/fi";

export default function FlashcardViewer({ subjectId, documentId = null, documentTitle = null, onClose, theme }) {
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        loadFlashcards();
    }, [subjectId, documentId]);

    const loadFlashcards = async () => {
        try {
            setLoading(true);
            setError(null);
            const cards = await generateFlashcards(subjectId, documentId);
            setFlashcards(cards || []);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (err) {
            console.error(err);
            const msg = err?.data?.error || err?.message || "Failed to generate flashcards. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col"
                    style={{ backgroundColor: theme.page_bg, border: `1px solid ${theme.border}` }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: theme.text_primary }}>
                                ✨ Flashcards
                            </h2>
                            {documentTitle && (
                                <p className="text-xs mt-0.5 truncate max-w-sm" style={{ color: theme.text_muted }}>
                                    {documentTitle}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center"
                            style={{ color: theme.text_muted }}
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                        {loading && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.accent, borderTopColor: "transparent" }} />
                                <p style={{ color: theme.text_muted }}>AI is analyzing your notes and generating flashcards...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center">
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    onClick={loadFlashcards}
                                    className="px-4 py-2 rounded-lg font-medium"
                                    style={{ backgroundColor: theme.surface_raised, color: theme.text_primary, border: `1px solid ${theme.border}` }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {!loading && !error && flashcards.length > 0 && (
                            <div className="w-full flex flex-col items-center">
                                <p className="text-sm font-medium mb-4" style={{ color: theme.text_muted }}>
                                    Card {currentIndex + 1} of {flashcards.length}
                                </p>
                                
                                {/* Flashcard */}
                                <div 
                                    className="w-full h-64 perspective-1000 cursor-pointer mb-8"
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <motion.div
                                        className="w-full h-full relative preserve-3d"
                                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        {/* Front (Question) */}
                                        <div 
                                            className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg p-8 flex items-center justify-center text-center border"
                                            style={{ backgroundColor: theme.surface_raised, borderColor: theme.border, backfaceVisibility: "hidden" }}
                                        >
                                            <h3 className="text-2xl font-medium" style={{ color: theme.text_primary }}>
                                                {flashcards[currentIndex].question}
                                            </h3>
                                        </div>

                                        {/* Back (Answer) */}
                                        <div 
                                            className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg p-8 flex items-center justify-center text-center border overflow-y-auto"
                                            style={{ backgroundColor: `${theme.accent}15`, borderColor: theme.accent, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                        >
                                            <p className="text-xl" style={{ color: theme.text_primary }}>
                                                {flashcards[currentIndex].answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-6 w-full justify-between">
                                    <button
                                        onClick={handlePrev}
                                        disabled={currentIndex === 0}
                                        className="px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: theme.surface_raised, color: theme.text_primary, border: `1px solid ${theme.border}` }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className="px-4 py-2 rounded-full font-medium transition-colors text-sm hover:opacity-80"
                                        style={{ color: theme.accent, border: `1px solid ${theme.accent}` }}
                                    >
                                        Flip
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={currentIndex === flashcards.length - 1}
                                        className="px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: theme.accent, color: theme.button_text || "#fff" }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {!loading && !error && flashcards.length === 0 && (
                            <p style={{ color: theme.text_muted }}>No flashcards could be generated.</p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
