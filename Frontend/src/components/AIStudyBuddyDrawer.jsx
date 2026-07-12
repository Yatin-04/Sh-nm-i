import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, X, Paperclip, Send, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument, chatWithStudyBuddy } from '../services/Operations/documentAPI';

// Simple markdown-to-JSX renderer for chat messages
const FormattedMessage = ({ text }) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    
    return (
        <div className="text-sm leading-relaxed space-y-1.5">
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('### ')) return <h4 key={i} className="font-semibold mt-2">{formatInline(line.slice(4))}</h4>;
                if (line.startsWith('## ')) return <h3 key={i} className="font-semibold mt-2 text-base">{formatInline(line.slice(3))}</h3>;
                
                // Bullet points
                if (line.match(/^[\s]*[-•]\s/)) {
                    const content = line.replace(/^[\s]*[-•]\s/, '');
                    return <div key={i} className="flex gap-1.5 ml-2"><span className="text-blue-400 shrink-0">•</span><span>{formatInline(content)}</span></div>;
                }
                
                // Numbered lists
                if (line.match(/^[\s]*\d+\.\s/)) {
                    const match = line.match(/^[\s]*(\d+)\.\s(.*)/);
                    if (match) return <div key={i} className="flex gap-1.5 ml-2"><span className="text-blue-400 shrink-0 font-medium">{match[1]}.</span><span>{formatInline(match[2])}</span></div>;
                }

                // Empty lines as spacers
                if (line.trim() === '') return <div key={i} className="h-1" />;
                if (line.trim() === '---') return <hr key={i} className="border-gray-200 dark:border-gray-700 my-2" />;
                
                // Regular paragraph
                return <p key={i}>{formatInline(line)}</p>;
            })}
        </div>
    );
};

// Inline formatting: bold, italic, code, links
function formatInline(text) {
    if (!text) return text;
    
    const parts = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
        // Bold **text** or *text* (italic)
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/\*([^*]+?)\*/);
        const codeMatch = remaining.match(/`([^`]+?)`/);
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        
        // Find earliest match
        const matches = [
            boldMatch && { idx: remaining.indexOf(boldMatch[0]), type: 'bold', match: boldMatch },
            italicMatch && !boldMatch?.index !== italicMatch?.index && { idx: remaining.indexOf(italicMatch[0]), type: 'italic', match: italicMatch },
            codeMatch && { idx: remaining.indexOf(codeMatch[0]), type: 'code', match: codeMatch },
            linkMatch && { idx: remaining.indexOf(linkMatch[0]), type: 'link', match: linkMatch },
        ].filter(Boolean).sort((a, b) => a.idx - b.idx);
        
        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }
        
        const first = matches[0];
        
        // Add text before the match
        if (first.idx > 0) {
            parts.push(remaining.slice(0, first.idx));
        }
        
        // Add formatted element
        if (first.type === 'bold') {
            parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>);
            remaining = remaining.slice(first.idx + first.match[0].length);
        } else if (first.type === 'italic') {
            parts.push(<em key={key++} className="italic">{first.match[1]}</em>);
            remaining = remaining.slice(first.idx + first.match[0].length);
        } else if (first.type === 'code') {
            parts.push(<code key={key++} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">{first.match[1]}</code>);
            remaining = remaining.slice(first.idx + first.match[0].length);
        } else if (first.type === 'link') {
            parts.push(<a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{first.match[1]}</a>);
            remaining = remaining.slice(first.idx + first.match[0].length);
        }
    }
    
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

export const AIStudyBuddyDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', text: 'Hi! I am your AI Study Buddy. Upload your notes or ask me anything about your current subject.' }
    ]);
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Pull active subject from Redux (set when user starts a Pomodoro session)
    const subjectId = useSelector((state) => state.timer.subjectId);
    const subjectName = useSelector((state) => state.timer.subjectName);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (!subjectId) {
            setMessages(prev => [...prev, { 
                id: Date.now(), role: 'ai', 
                text: '⚠️ No active subject. Start a Pomodoro session first so I know which notes to search!' 
            }]);
            return;
        }

        const userMsg = { id: Date.now(), role: 'user', text: input };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        const userQuestion = input;
        setInput('');
        setIsLoading(true);

        try {
            // Send recent chat history for conversational context
            const history = updatedMessages
                .filter(m => m.role === 'user' || m.role === 'ai')
                .slice(-6)
                .map(m => ({ role: m.role, text: m.text }));

            const data = await chatWithStudyBuddy(subjectId, userQuestion, history);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = error?.data?.reply || error?.data?.error || 
                'Something went wrong. Make sure the server is running and your documents have finished processing.';
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, role: 'ai', 
                text: errorMsg
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!subjectId) {
            setMessages(prev => [...prev, { 
                id: Date.now(), role: 'ai', 
                text: '⚠️ No active subject. Start a Pomodoro session first, then upload notes.' 
            }]);
            return;
        }

        setIsUploading(true);
        setMessages(prev => [...prev, { 
            id: Date.now(), role: 'user', 
            text: `📎 Uploading "${file.name}"...` 
        }]);

        try {
            await uploadDocument(subjectId, file);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, role: 'ai', 
                text: `✅ "${file.name}" uploaded! It's being processed in the background. You can ask questions about it in a moment.` 
            }]);
        } catch (error) {
            console.error("Upload error:", error);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, role: 'ai', 
                text: `❌ Failed to upload "${file.name}". Please try again.` 
            }]);
        } finally {
            setIsUploading(false);
            // Reset file input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            {/* Global Floating Action Button */}
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 z-50 flex items-center justify-center transition-colors"
                aria-label="Open AI Study Buddy"
            >
                <MessageCircle size={28} />
            </motion.button>

            {/* Side Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        
                        {/* Drawer panel */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 w-full md:w-96 h-full bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        AI
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Study Buddy</h2>
                                        {subjectId ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">📘 {subjectName}</p>
                                        ) : (
                                            <p className="text-xs text-amber-500">No active session</p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Chat History */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900">
                                {messages.map((msg) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id} 
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                                            msg.role === 'user' 
                                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-sm'
                                        }`}>
                                            {msg.role === 'ai' ? (
                                                <FormattedMessage text={msg.text} />
                                            ) : (
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-blue-600" />
                                            <span className="text-sm text-gray-500">Buddy is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                                <form onSubmit={handleSend} className="relative flex items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute left-2 p-2 text-gray-400 hover:text-blue-600 transition"
                                        disabled={isUploading || isLoading}
                                        title="Upload notes or screenshot"
                                    >
                                        {isUploading ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <Paperclip size={20} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                        accept=".pdf,text/plain,image/*"
                                    />
                                    
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-transparent rounded-full focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-gray-700 text-sm outline-none transition"
                                        disabled={isLoading}
                                    />
                                    
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
