import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiX, FiDownload, FiExternalLink, FiSend, FiTrash2 } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithStudyBuddy, getDocumentChat, clearDocumentChat } from "../../services/Operations/documentAPI";

// ─── Inline markdown renderer ──────────────────────────────────────────────

function formatInline(text) {
    if (!text) return text;
    const parts = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
        const boldMatch  = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/\*([^*]+?)\*/);
        const codeMatch  = remaining.match(/`([^`]+?)`/);
        const linkMatch  = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const matches = [
            boldMatch  && { idx: remaining.indexOf(boldMatch[0]),  type: "bold",   match: boldMatch },
            italicMatch && !boldMatch   && { idx: remaining.indexOf(italicMatch[0]), type: "italic", match: italicMatch },
            codeMatch  && { idx: remaining.indexOf(codeMatch[0]),  type: "code",   match: codeMatch },
            linkMatch  && { idx: remaining.indexOf(linkMatch[0]),  type: "link",   match: linkMatch },
        ].filter(Boolean).sort((a, b) => a.idx - b.idx);
        if (!matches.length) { parts.push(remaining); break; }
        const first = matches[0];
        if (first.idx > 0) parts.push(remaining.slice(0, first.idx));
        if (first.type === "bold")   { parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>); }
        else if (first.type === "italic") { parts.push(<em key={key++} className="italic">{first.match[1]}</em>); }
        else if (first.type === "code")   { parts.push(<code key={key++} className="px-1 py-0.5 bg-black/10 rounded text-[0.75em] font-mono">{first.match[1]}</code>); }
        else if (first.type === "link")   { parts.push(<a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100">{first.match[1]}</a>); }
        remaining = remaining.slice(first.idx + first.match[0].length);
    }
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

const FormattedMessage = ({ text }) => {
    if (!text) return null;
    return (
        <div className="text-sm leading-relaxed space-y-1">
            {text.split("\n").map((line, i) => {
                if (line.startsWith("### ")) return <h4 key={i} className="font-semibold mt-1.5">{formatInline(line.slice(4))}</h4>;
                if (line.startsWith("## "))  return <h3 key={i} className="font-semibold mt-1.5 text-base">{formatInline(line.slice(3))}</h3>;
                if (line.match(/^[\s]*[-•]\s/)) {
                    const content = line.replace(/^[\s]*[-•]\s/, "");
                    return <div key={i} className="flex gap-1.5 ml-2"><span className="shrink-0 opacity-50">•</span><span>{formatInline(content)}</span></div>;
                }
                if (line.match(/^[\s]*\d+\.\s/)) {
                    const m = line.match(/^[\s]*(\d+)\.\s(.*)/);
                    if (m) return <div key={i} className="flex gap-1.5 ml-2"><span className="shrink-0 font-medium opacity-60">{m[1]}.</span><span>{formatInline(m[2])}</span></div>;
                }
                if (line.trim() === "")    return <div key={i} className="h-1" />;
                if (line.trim() === "---") return <hr key={i} className="border-current opacity-10 my-1" />;
                return <p key={i}>{formatInline(line)}</p>;
            })}
        </div>
    );
};

// ─── Document Preview pane ──────────────────────────────────────────────────

function PreviewPane({ doc, theme, txtContent, loadingText }) {
    const isPdf   = doc.file_type === "application/pdf" || doc.title?.toLowerCase().endsWith(".pdf");
    const isImage = doc.file_type?.startsWith("image/") || doc.title?.toLowerCase().match(/\.(png|jpe?g|gif|webp)$/);
    const isTxt   = doc.file_type === "text/plain" || doc.title?.toLowerCase().endsWith(".txt");

    if (isImage) return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <img src={doc.file_url} className="max-w-full max-h-full object-contain rounded-lg shadow" alt={doc.title} />
        </div>
    );

    if (isPdf) return (
        <div className="w-full h-full rounded-lg overflow-hidden">
            <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`}
                className="w-full h-full border-0"
                title={doc.title}
                loading="lazy"
            />
        </div>
    );

    if (isTxt) return loadingText ? (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.accent, borderTopColor: "transparent" }} />
        </div>
    ) : (
        <div className="w-full h-full overflow-auto p-6 rounded-lg font-mono text-sm leading-relaxed border" style={{ backgroundColor: theme.surface, color: theme.text_primary, borderColor: theme.border }}>
            <pre className="whitespace-pre-wrap">{txtContent}</pre>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-center" style={{ color: theme.text_secondary }}>No live preview for this file type.</p>
            <a
                href={doc.file_url} target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: theme.accent, color: theme.button_text || "#fff" }}
            >
                <FiExternalLink size={16} /><span>Open Document</span>
            </a>
        </div>
    );
}

// ─── AI Chat pane ───────────────────────────────────────────────────────────

function AIChatPane({ doc, subjectId, theme }) {
    const welcomeMsg = {
        id: "init",
        role: "ai",
        text: `Hi! I'm your Study Buddy. Ask me anything about **${doc.title}** — I'll search its content first and look things up online if needed.`,
    };

    const [messages, setMessages]   = useState([welcomeMsg]);
    const [input, setInput]         = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(true);
    const bottomRef = useRef(null);

    // Load persistent history on mount
    useEffect(() => {
        let isMounted = true;
        async function fetchHistory() {
            setIsFetchingHistory(true);
            try {
                const historyData = await getDocumentChat(doc.id);
                if (isMounted && Array.isArray(historyData) && historyData.length > 0) {
                    const formatted = historyData.map(m => ({
                        id: m.id,
                        role: m.role,
                        text: m.content,
                    }));
                    setMessages(formatted);
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            } finally {
                if (isMounted) setIsFetchingHistory(false);
            }
        }
        if (doc?.id) fetchHistory();
        return () => { isMounted = false; };
    }, [doc?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isFetchingHistory]);

    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to clear the chat history for this document?")) return;
        try {
            await clearDocumentChat(doc.id);
            setMessages([welcomeMsg]);
        } catch (err) {
            console.error("Failed to clear chat history", err);
        }
    };

    const handleSend = useCallback(async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg = { id: Date.now(), role: "user", text: trimmed };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput("");
        setIsLoading(true);

        try {
            // Token Management: Pass only the 6 most recent conversational messages as context to agent
            const history = updated
                .filter(m => m.role === "user" || m.role === "ai")
                .slice(-6)
                .map(m => ({ role: m.role, text: m.text }));

            const data = await chatWithStudyBuddy(subjectId, trimmed, history, doc.id);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: data.reply }]);
        } catch (err) {
            const msg = err?.data?.reply || err?.data?.error || "Something went wrong. Please try again.";
            setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: `⚠️ ${msg}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, messages, isLoading, subjectId, doc.id]);

    const userBubble = "rounded-2xl rounded-tr-sm px-3 py-2.5 max-w-[84%] text-white bg-blue-600 text-sm leading-relaxed";
    const aiBubble   = "rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[90%] border shadow-sm text-sm";

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="px-4 py-3 border-b flex items-center justify-between gap-2.5 shrink-0" style={{ borderColor: theme.border_subtle }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">AI</div>
                    <div>
                        <p className="text-xs font-semibold" style={{ color: theme.text_primary }}>Study Buddy</p>
                        <p className="text-[10px]" style={{ color: theme.text_muted }}>Answering from this document + web</p>
                    </div>
                </div>
                {messages.length > 1 && (
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                        style={{ color: theme.text_muted }}
                        title="Clear Chat History"
                    >
                        <FiTrash2 size={15} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {isFetchingHistory ? (
                    <div className="flex items-center justify-center h-full gap-2" style={{ color: theme.text_muted }}>
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        <span className="text-xs">Loading conversation…</span>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "user" ? (
                                <p className={userBubble}>{msg.text}</p>
                            ) : (
                                <div
                                    className={aiBubble}
                                    style={{
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border,
                                        color: theme.text_primary,
                                    }}
                                >
                                    <FormattedMessage text={msg.text} />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl rounded-tl-sm border shadow-sm text-sm" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                            <Loader2 size={13} className="animate-spin text-blue-500" />
                            <span style={{ color: theme.text_muted }} className="text-xs">Thinking…</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: theme.border_subtle }}>
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about this document…"
                        disabled={isLoading}
                        className="flex-1 text-sm rounded-xl px-3 py-2 border outline-none transition-colors"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text_primary,
                        }}
                        onFocus={e => { e.target.style.borderColor = theme.accent; }}
                        onBlur={e => { e.target.style.borderColor = theme.border; }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <FiSend size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export default function DocumentPreviewModal({ document: doc, subjectId, onClose, theme }) {
    if (!doc) return null;

    const isTxt = doc.file_type === "text/plain" || doc.title?.toLowerCase().endsWith(".txt");
    const [txtContent, setTxtContent]   = useState("");
    const [loadingText, setLoadingText] = useState(false);

    useEffect(() => {
        if (isTxt) {
            setLoadingText(true);
            fetch(doc.file_url)
                .then(r => r.text())
                .then(text => { setTxtContent(text); setLoadingText(false); })
                .catch(() => { setTxtContent("Failed to load text content."); setLoadingText(false); });
        }
    }, [doc, isTxt]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 16 }}
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-7xl rounded-sm shadow-2xl flex flex-col"
                    style={{
                        backgroundColor: theme.surface_raised,
                        border: `1px solid ${theme.border}`,
                        height: "90vh",
                    }}
                >
                    {/* ── Modal Header ── */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: theme.border_subtle }}>
                        <div className="min-w-0 pr-4">
                            <h2 className="text-base font-bold truncate" style={{ color: theme.text_primary }} title={doc.title}>
                                {doc.title}
                            </h2>
                            <p className="text-[11px] mt-0.5" style={{ color: theme.text_muted }}>{doc.file_type}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg border hover:opacity-80 transition flex items-center justify-center cursor-pointer"
                                style={{ borderColor: theme.border, color: theme.text_primary, backgroundColor: theme.surface }}
                                title="Open in new tab"
                            >
                                <FiExternalLink size={16} />
                            </a>
                            <a
                                href={doc.file_url} download
                                className="p-2 rounded-lg border hover:opacity-80 transition flex items-center justify-center cursor-pointer"
                                style={{ borderColor: theme.border, color: theme.text_primary, backgroundColor: theme.surface }}
                                title="Download"
                            >
                                <FiDownload size={16} />
                            </a>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-black/10 transition flex items-center justify-center cursor-pointer"
                                style={{ color: theme.text_muted }}
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ── Split body ── */}
                    <div className="flex flex-1 overflow-hidden rounded-b-2xl">
                        {/* Left — Document Preview (60%) */}
                        <div className="w-[60%] h-full overflow-hidden p-3 border-r" style={{ borderColor: theme.border_subtle }}>
                            <div className="w-full h-full overflow-hidden rounded-lg bg-black/[0.06]">
                                <PreviewPane doc={doc} theme={theme} txtContent={txtContent} loadingText={loadingText} />
                            </div>
                        </div>

                        {/* Right — AI Study Buddy (40%) */}
                        <div className="w-[40%] h-full overflow-hidden flex flex-col">
                            <AIChatPane doc={doc} subjectId={subjectId} theme={theme} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
