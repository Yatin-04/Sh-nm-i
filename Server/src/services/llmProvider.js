/**
 * LLM Provider Abstraction
 * 
 * Uses Ollama locally (dev) and Groq API in production (deploy).
 * Groq is free-tier friendly (30 req/min, 14,400 req/day) and runs
 * Llama/Qwen models on their hardware — no GPU needed on your server.
 * 
 * Set LLM_PROVIDER=groq in production .env to switch.
 */

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama'; // 'ollama' | 'groq'

// Ollama config (local)
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:3b';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

// Groq config (production)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ─── Chat Completion ────────────────────────────────────────────────────────

export const chatCompletion = async (messages, tools = null) => {
    if (LLM_PROVIDER === 'groq') {
        return await groqChat(messages, tools);
    }
    return await ollamaChat(messages, tools);
};

async function ollamaChat(messages, tools) {
    const body = {
        model: OLLAMA_CHAT_MODEL,
        messages,
        stream: false,
    };
    if (tools) body.tools = tools;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama chat failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    
    // Normalize to common format
    return {
        content: data.message?.content || '',
        toolCalls: data.message?.tool_calls || null,
    };
}

async function groqChat(messages, tools) {
    const body = {
        model: GROQ_CHAT_MODEL,
        messages,
        stream: false,
    };

    if (tools) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq chat failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    // Normalize Groq's OpenAI-style tool_calls to our format
    let toolCalls = null;
    if (choice?.tool_calls && choice.tool_calls.length > 0) {
        toolCalls = choice.tool_calls.map(tc => ({
            function: {
                name: tc.function.name,
                arguments: typeof tc.function.arguments === 'string'
                    ? JSON.parse(tc.function.arguments)
                    : tc.function.arguments,
            },
            id: tc.id,
        }));
    }

    return {
        content: choice?.content || '',
        toolCalls,
        // Store raw for conversation threading (Groq needs tool_call_id)
        _raw: choice,
    };
}

// ─── Embeddings ─────────────────────────────────────────────────────────────

export const generateEmbedding = async (text) => {
    if (process.env.VOYAGE_API_KEY) {
        return await hfEmbedding(text);
    }
    return await ollamaEmbedding(text);
};

/**
 * Batch embed multiple texts in a single call.
 * Uses Voyage AI in production, Ollama locally.
 */
export const generateEmbeddingBatch = async (texts) => {
    if (process.env.VOYAGE_API_KEY) {
        return await hfEmbeddingBatch(texts);
    }
    return await ollamaEmbeddingBatch(texts);
};

async function ollamaEmbeddingBatch(texts) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_EMBED_MODEL,
            input: texts,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama batch embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embeddings; // Array of embedding arrays
}

async function ollamaEmbedding(text) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_EMBED_MODEL,
            input: text,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
}

async function hfEmbedding(text) {
    // Voyage AI — 200M free tokens, reliable infrastructure
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({ 
            model: 'voyage-3-lite',
            input: [text],
            output_dimension: 512,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Voyage embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function hfEmbeddingBatch(texts) {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({ 
            model: 'voyage-3-lite',
            input: texts,
            output_dimension: 512,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Voyage batch embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.data.map(item => item.embedding);
}

// ─── Tool format helpers ────────────────────────────────────────────────────

/**
 * Builds a tool response message in the correct format for the current provider.
 */
export const buildToolResponseMessage = (toolCall, content) => {
    if (LLM_PROVIDER === 'groq') {
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content,
        };
    }
    // Ollama format
    return {
        role: 'tool',
        content,
    };
};

/**
 * Builds the assistant message to add back to the conversation after a tool call.
 * Needed because Groq requires the full assistant message with tool_calls in the history.
 */
export const buildAssistantToolCallMessage = (rawResponse) => {
    if (LLM_PROVIDER === 'groq' && rawResponse._raw) {
        return rawResponse._raw;
    }
    // For Ollama, we already push the message in the loop
    return null;
};

export { LLM_PROVIDER };
