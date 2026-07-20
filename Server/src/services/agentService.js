import { searchLocalNotes } from './documentService.js';
import { chatCompletion, buildToolResponseMessage, LLM_PROVIDER } from './llmProvider.js';
import { tavily } from '@tavily/core';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

// Tool definitions
const tools = [
    {
        type: "function",
        function: {
            name: "searchLocalNotes",
            description: "Search the user's uploaded study notes and textbooks for relevant information. Use this to find answers from their materials.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to find in the user's notes.",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "searchWeb",
            description: "Search the internet. Use ONLY if searchLocalNotes found nothing relevant.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The web search query.",
                    },
                },
                required: ["query"],
            },
        },
    },
];

const SYSTEM_PROMPT = `You are a Study Buddy AI that helps students understand their course material.

HOW TO ANSWER:
1. First, search the user's uploaded notes using searchLocalNotes.
2. If notes have nothing relevant, use searchWeb.
3. Whether your information comes from searchLocalNotes or searchWeb, you must ALWAYS synthesize it into a clear explanation in your own words — never paste raw search snippets or a list of links as the answer. 
4. After explaining, cite EXACTLY what you used based ONLY on the tool results provided to you. For notes: use the document title and page number provided. For web: use the site name and URL provided. 
5. CRITICAL: NEVER make up or hallucinate document names, book titles, or page numbers. If you are answering from your own pre-training because searches failed, your citation MUST simply be: "📌 Reference: General Knowledge".

RESPONSE FORMAT:
- Give a clear, educational explanation FIRST (2-4 paragraphs for complex topics, 1-2 for simple ones)
- Use examples where helpful
- Then add citations at the end:
  📌 Reference: "Actual Source Name From Tools" — Page X-Y or URL (or "General Knowledge" if no source was used)

IMPORTANT:
- Your primary job is to EXPLAIN and TEACH, not just cite.
- Be conversational and helpful.`;

const executeWebSearch = async (searchQuery) => {
    console.log(`Executing Tavily web search for: ${searchQuery}`);
    
    if (!process.env.TAVILY_API_KEY) {
        return "Web search unavailable.";
    }

    try {
        const response = await tvly.search(searchQuery, {
            searchDepth: "basic",
            maxResults: 3,
        });
        
        if (!response.results || response.results.length === 0) {
            return "No relevant web results found.";
        }

        return response.results
            .map((r, i) => `[Web ${i + 1}] "${r.title}" (${r.url})\n${r.content}`)
            .join("\n\n---\n\n");
    } catch (error) {
        console.error("Tavily search failed:", error.message);
        return "Web search failed.";
    }
};

const formatNotesWithSources = (notes) => {
    if (!notes || notes.length === 0) {
        return "No relevant notes found in the user's documents.";
    }

    const relevant = notes.filter(n => n.similarity > 0.25);
    
    if (relevant.length === 0) {
        return "No relevant notes found in the user's documents.";
    }

    return relevant.map((note, i) => {
        let pageRef = "";
        if (note.page_start && note.page_end) {
            pageRef = note.page_start === note.page_end
                ? `Page ${note.page_start}`
                : `Pages ${note.page_start}–${note.page_end}`;
        } else if (note.page_start) {
            pageRef = `Page ${note.page_start}`;
        }

        const docName = note.document_title || "Uploaded document";
        const header = pageRef ? `[Source ${i + 1}] "${docName}" — ${pageRef}` : `[Source ${i + 1}] "${docName}"`;
        
        return `${header}\n${note.content}`;
    }).join("\n\n---\n\n");
};

const rewriteQueryForRetrieval = async (rawQuery, history) => {
    if (!history || history.length === 0) return rawQuery;

    const historyText = history
        .slice(-4)
        .map(m => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.text}`)
        .join('\n');

    const rewritePrompt = [
        {
            role: 'system',
            content: 'Rewrite the latest message into a fully standalone search query, resolving any pronouns or references to earlier context. Return ONLY the rewritten query — no explanation, no quotes.'
        },
        {
            role: 'user',
            content: `Conversation so far:\n${historyText}\n\nLatest message to rewrite: "${rawQuery}"`
        }
    ];

    try {
        const result = await chatCompletion(rewritePrompt, null);
        const rewritten = result.content?.trim();
        return rewritten && rewritten.length > 0 ? rewritten : rawQuery;
    } catch (err) {
        console.error('Query rewrite failed, falling back to raw query:', err.message);
        return rawQuery;
    }
};

/**
 * Run the Study Buddy agent.
 * @param {string} subjectId - The subject to search within
 * @param {string} userMessage - The user's current message
 * @param {Array} chatHistory - Previous messages for context (optional)
 * @param {string|null} documentId - Narrow search to a specific document (optional)
 */
export const runStudyBuddyAgent = async (subjectId, userMessage, chatHistory = [], documentId = null) => {
    // Build messages array with system prompt + history + current message
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add recent chat history for context (last 6 messages max to stay within limits)
    const recentHistory = chatHistory.slice(-6);
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.text,
        });
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // Agentic loop
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
        iterations++;

        const result = await chatCompletion(messages, tools);

        // Add assistant response to conversation
        if (LLM_PROVIDER === 'groq' && result._raw) {
            messages.push(result._raw);
        } else {
            const assistantMsg = { role: 'assistant', content: result.content || '' };
            if (result.toolCalls) assistantMsg.tool_calls = result.toolCalls;
            messages.push(assistantMsg);
        }

        // If model responded with text and no tool calls → we have our answer
        if (!result.toolCalls || result.toolCalls.length === 0) {
            if (result.content && result.content.trim()) {
                return result.content;
            }
            // Empty response — try one more time without tools
            const fallback = await chatCompletion(messages, null);
            return fallback.content || "I couldn't generate a response. Please try asking differently.";
        }

        // Process tool calls
        for (const toolCall of result.toolCalls) {
            const fnName = toolCall.function.name;
            const args = toolCall.function.arguments;
            let toolResult = "";

            if (fnName === "searchLocalNotes") {
                console.log("Agent → searchLocalNotes (raw):", args.query);
                try {
                    const rewrittenQuery = await rewriteQueryForRetrieval(args.query, recentHistory);
                    console.log("Agent → searchLocalNotes (rewritten):", rewrittenQuery);
                    
                    const notes = await searchLocalNotes(rewrittenQuery, subjectId, 8, documentId);
                    toolResult = formatNotesWithSources(notes);
                    
                    if (toolResult === "No relevant notes found in the user's documents.") {
                        console.log("No notes found, automatically falling back to web search...");
                        const webResults = await executeWebSearch(rewrittenQuery);
                        toolResult = "No relevant notes found in local documents. I automatically searched the web instead. Here are the web results:\n\n" + webResults;
                    }
                } catch (err) {
                    console.error("searchLocalNotes error:", err.message);
                    console.log("Notes search errored, automatically falling back to web search...");
                    const webResults = await executeWebSearch(args.query);
                    toolResult = "There was an error searching local documents (they may still be processing). I automatically searched the web instead. Here are the web results:\n\n" + webResults;
                }
            } else if (fnName === "searchWeb") {
                console.log("Agent → searchWeb:", args.query);
                toolResult = await executeWebSearch(args.query);
            } else {
                toolResult = `Unknown tool: ${fnName}`;
            }

            messages.push(buildToolResponseMessage(toolCall, toolResult));
        }
    }

    // If we hit max iterations, make one final call without tools to force a text response
    const finalAttempt = await chatCompletion(messages, null);
    return finalAttempt.content || "I searched your notes but couldn't put together a clear answer. Try asking in a different way.";
};
