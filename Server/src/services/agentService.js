import { searchLocalNotes } from './documentService.js';
import { chatCompletion, buildToolResponseMessage, LLM_PROVIDER } from './llmProvider.js';
import { tavily } from '@tavily/core';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

// Tool definitions (Ollama format)
const tools = [
    {
        type: "function",
        function: {
            name: "searchLocalNotes",
            description: "Search the user's uploaded study notes, textbooks, and documents for relevant information. Always try this FIRST before searching the web.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to look for in the user's notes and books.",
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
            description: "Search the internet for information. ONLY use this if searchLocalNotes returned no relevant results or explicitly said 'No relevant notes found'.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The query to search the web for.",
                    },
                },
                required: ["query"],
            },
        },
    },
];

const executeWebSearch = async (searchQuery) => {
    console.log(`Executing Tavily web search for: ${searchQuery}`);
    
    if (!process.env.TAVILY_API_KEY) {
        return "Web search is not configured (TAVILY_API_KEY missing). Cannot search online.";
    }

    try {
        const response = await tvly.search(searchQuery, {
            searchDepth: "basic",
            maxResults: 3,
        });
        
        if (!response.results || response.results.length === 0) {
            return "No relevant web results found for this query.";
        }

        const contextString = response.results
            .map((r, i) => `[Web Source ${i + 1}] "${r.title}" — ${r.url}\n${r.content}`)
            .join("\n\n---\n\n");
        return contextString;
    } catch (error) {
        console.error("Tavily search failed:", error.message);
        return "Web search failed due to a network error. Please try again later.";
    }
};

/**
 * Formats search results from local notes into a context string with source citations.
 * This tells the LLM exactly where the info came from so it can cite it.
 */
const formatNotesWithSources = (notes) => {
    if (!notes || notes.length === 0) {
        return "No relevant notes found in the user's documents.";
    }

    // Filter by similarity threshold — only include genuinely relevant results
    const relevant = notes.filter(n => n.similarity > 0.3);
    
    if (relevant.length === 0) {
        return "No relevant notes found in the user's documents.";
    }

    return relevant.map((note, i) => {
        let pageRef = "Page unknown";
        if (note.page_start && note.page_end) {
            pageRef = note.page_start === note.page_end
                ? `Page ${note.page_start}`
                : `Pages ${note.page_start}–${note.page_end}`;
        } else if (note.page_start) {
            pageRef = `Page ${note.page_start}`;
        }

        const docName = note.document_title || "Untitled document";
        
        return `[Source ${i + 1}] "${docName}" — ${pageRef} (similarity: ${(note.similarity * 100).toFixed(0)}%)\n${note.content}`;
    }).join("\n\n---\n\n");
};

export const runStudyBuddyAgent = async (subjectId, userMessage) => {
    const messages = [
        {
            role: "system",
            content: `You are a helpful AI Study Buddy. You help students understand concepts from their uploaded study materials.

CITATION RULES (you MUST follow these):

When answering from LOCAL NOTES (searchLocalNotes results):
- Each source is labeled like: [Source 1] "Book Title" — Page X
- In your answer, ALWAYS cite using this format: 📖 *Book Title*, Page X
- Example: "According to 📖 *Introduction to Algorithms*, Page 631, Kruskal's algorithm works by..."
- At the end of your answer, add a "📌 Where to review:" section listing the exact pages
- Example:
  📌 Where to review:
  • "Introduction to Algorithms" — Pages 631–632
  • "Graph Theory Notes" — Page 12

When answering from WEB SEARCH (searchWeb results):
- Each source includes a title and URL
- In your answer, clearly state this came from the internet
- Cite web sources with: 🌐 *Title* (URL)
- Example: "Based on online sources: 🌐 *GeeksforGeeks* (https://geeksforgeeks.org/...)"
- Note to the user that this info is NOT in their uploaded notes

BEHAVIOR RULES:
1. ALWAYS call searchLocalNotes FIRST.
2. Only call searchWeb if local notes explicitly have no relevant results.
3. If both local and web are used, clearly separate which info came from where.
4. Be educational — explain concepts clearly with examples.
5. Keep answers concise unless the user asks for depth.`,
        },
        {
            role: "user",
            content: userMessage,
        },
    ];

    // Agentic loop
    let iterations = 0;
    const MAX_ITERATIONS = 4;

    while (iterations < MAX_ITERATIONS) {
        iterations++;

        const result = await chatCompletion(messages, tools);

        // Add assistant message to history
        if (LLM_PROVIDER === 'groq' && result._raw) {
            messages.push(result._raw);
        } else {
            // Ollama: reconstruct the message
            const assistantMsg = { role: 'assistant', content: result.content };
            if (result.toolCalls) assistantMsg.tool_calls = result.toolCalls;
            messages.push(assistantMsg);
        }

        // No tool calls → return the final answer
        if (!result.toolCalls || result.toolCalls.length === 0) {
            return result.content;
        }

        // Process tool calls
        for (const toolCall of result.toolCalls) {
            const fnName = toolCall.function.name;
            const args = toolCall.function.arguments;
            let toolResult = "";

            if (fnName === "searchLocalNotes") {
                console.log("Agent called searchLocalNotes with:", args.query);
                try {
                    const notes = await searchLocalNotes(args.query, subjectId, 5);
                    toolResult = formatNotesWithSources(notes);
                } catch (err) {
                    console.error("searchLocalNotes error:", err.message);
                    toolResult = "Error searching local notes. Try again.";
                }
            } else if (fnName === "searchWeb") {
                console.log("Agent called searchWeb with:", args.query);
                toolResult = await executeWebSearch(args.query);
            } else {
                toolResult = `Unknown tool: ${fnName}`;
            }

            messages.push(buildToolResponseMessage(toolCall, toolResult));
        }
    }

    const lastAssistant = messages.filter(m => m.role === "assistant").pop();
    return lastAssistant?.content || "I wasn't able to find an answer. Please try rephrasing your question.";
};
