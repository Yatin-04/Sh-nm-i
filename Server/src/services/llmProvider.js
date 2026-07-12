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
    if (LLM_PROVIDER === 'groq' || !process.env.OLLAMA_URL) {
        if (process.env.HF_API_KEY) {
            return await hfEmbedding(text);
        }
    }
    return await ollamaEmbedding(text);
};

/**
 * Batch embed multiple texts in a single call.
 * Uses Ollama locally or HuggingFace in production.
 */
export const generateEmbeddingBatch = async (texts) => {
    if (LLM_PROVIDER === 'groq' || !process.env.OLLAMA_URL) {
        if (process.env.HF_API_KEY) {
            return await hfEmbeddingBatch(texts);
        }
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
    // HuggingFace Inference Providers API for embeddings
    const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5/pipeline/feature-extraction',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.HF_API_KEY}`,
            },
            body: JSON.stringify({ inputs: text }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HuggingFace embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    // HF returns [[...embedding...]] for single input
    const embedding = Array.isArray(data[0]) ? data[0] : data;
    return embedding.slice(0, 768);
}

async function hfEmbeddingBatch(texts) {
    // HuggingFace supports batch inputs
    const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5/pipeline/feature-extraction',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.HF_API_KEY}`,
            },
            body: JSON.stringify({ inputs: texts }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HuggingFace batch embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    // HF returns [[emb1], [emb2], ...] for batch
    return data.map(emb => (Array.isArray(emb) ? emb : emb).slice(0, 768));
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
