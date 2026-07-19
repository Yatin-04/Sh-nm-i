/**
 * LLM Provider Abstraction
 * 
 * Chat: Groq (production) or Ollama (local dev)
 * Embeddings: Voyage AI (production) or Ollama (local dev)
 */

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama';

// Ollama (local dev)
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:3b';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

// Groq (production chat)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ─── Chat ───────────────────────────────────────────────────────────────────

export const chatCompletion = async (messages, tools = null) => {
    if (LLM_PROVIDER === 'groq') return await groqChat(messages, tools);
    return await ollamaChat(messages, tools);
};

async function ollamaChat(messages, tools) {
    const body = { model: OLLAMA_CHAT_MODEL, messages, stream: false };
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
    return {
        content: data.message?.content || '',
        toolCalls: data.message?.tool_calls || null,
    };
}

async function groqChat(messages, tools) {
    const body = { model: GROQ_CHAT_MODEL, messages, stream: false };
    if (tools) { body.tools = tools; body.tool_choice = 'auto'; }

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

    let toolCalls = null;
    if (choice?.tool_calls?.length > 0) {
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

    return { content: choice?.content || '', toolCalls, _raw: choice };
}

// ─── Embeddings ─────────────────────────────────────────────────────────────

export const generateEmbedding = async (text) => {
    if (process.env.VOYAGE_API_KEY) return await voyageEmbed([text]).then(r => r[0]);
    return await ollamaEmbed(text);
};

export const generateEmbeddingBatch = async (texts) => {
    if (process.env.VOYAGE_API_KEY) return await voyageEmbed(texts);
    return await ollamaEmbedBatch(texts);
};

async function voyageEmbed(inputs) {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'voyage-3-lite',
            input: inputs,
            output_dimension: 512,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Voyage embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.data.map(item => item.embedding);
}

async function ollamaEmbed(text) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: text }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
}

async function ollamaEmbedBatch(texts) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: texts }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama batch embed failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embeddings;
}

// ─── Tool format helpers ────────────────────────────────────────────────────

export const buildToolResponseMessage = (toolCall, content) => {
    if (LLM_PROVIDER === 'groq') {
        return { role: 'tool', tool_call_id: toolCall.id, content };
    }
    return { role: 'tool', content };
};

export { LLM_PROVIDER };
