interface NIMConfig {
  apiKey: string;
  endpoint: string;
  embeddingModel: string;
  chatModel: string;
}

interface EmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
}

interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface BatchRequest<T> {
  items: T[];
  batchSize?: number;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface Note {
  id: string;
  content: string;
  title: string;
  metadata?: Record<string, any>;
}

interface SimilarityResult {
  noteId: string;
  score: number;
  reason?: string;
}

interface ConnectionSuggestion {
  sourceId: string;
  targetId: string;
  score: number;
  reason: string;
}

class NIMService {
  private config: NIMConfig;
  private retryConfig: RetryConfig;

  constructor(config: NIMConfig, retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }) {
    this.config = config;
    this.retryConfig = retryConfig;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    attemptNumber: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (attemptNumber >= this.retryConfig.maxRetries) {
        throw new Error(`Request failed after ${this.retryConfig.maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`);
      }

      const delay = Math.min(
        this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber),
        this.retryConfig.maxDelay
      );

      await this.sleep(delay);
      return this.fetchWithRetry<T>(url, options, attemptNumber + 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getEmbedding(text: string): Promise<number[]> {
    const request: EmbeddingRequest = {
      input: text,
      model: this.config.embeddingModel,
      encoding_format: 'float'
    };

    const response = await this.fetchWithRetry<EmbeddingResponse>(
      `${this.config.endpoint}/v1/embeddings`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    );

    if (response.data.length === 0) {
      throw new Error('No embedding data returned from API');
    }

    return response.data[0].embedding;
  }

  async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = 20;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const request: EmbeddingRequest = {
        input: batch,
        model: this.config.embeddingModel,
        encoding_format: 'float'
      };

      const response = await this.fetchWithRetry<EmbeddingResponse>(
        `${this.config.endpoint}/v1/embeddings`,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      for (const data of response.data) {
        embeddings[data.index + (i / batchSize) * batchSize] = data.embedding;
      }
    }

    return embeddings;
  }

  async extractNoteEmbedding(note: Note): Promise<{ noteId: string; embedding: number[] }> {
    const content = this.prepareNoteContent(note);
    const embedding = await this.getEmbedding(content);
    return { noteId: note.id, embedding };
  }

  async extractNoteEmbeddingsBatch(notes: Note[]): Promise<Map<string, number[]>> {
    const texts = notes.map(note => this.prepareNoteContent(note));
    const embeddings = await this.getBatchEmbeddings(texts);

    const embeddingMap = new Map<string, number[]>();
    notes.forEach((note, index) => {
      embeddingMap.set(note.id, embeddings[index]);
    });

    return embeddingMap;
  }

  private prepareNoteContent(note: Note): string {
    let content = note.title;
    if (note.content) {
      content += '\n\n' + note.content;
    }
    if (note.metadata) {
      const metadataContent = Object.entries(note.metadata)
        .filter(([key]) => key !== 'position')
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
      if (metadataContent) {
        content += '\n\n' + metadataContent;
      }
    }
    return content;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async calculateSimilarity(
    note1: Note,
    note2: Note,
    embeddings?: Map<string, number[]>
  ): Promise<number> {
    let embedding1, embedding2;

    if (embeddings) {
      embedding1 = embeddings.get(note1.id);
      embedding2 = embeddings.get(note2.id);
    }

    if (!embedding1) {
      embedding1 = await this.getEmbedding(this.prepareNoteContent(note1));
    }
    if (!embedding2) {
      embedding2 = await this.getEmbedding(this.prepareNoteContent(note2));
    }

    return this.cosineSimilarity(embedding1, embedding2);
  }

  async findSimilarNotes(
    targetNote: Note,
    candidateNotes: Note[],
    threshold: number = 0.5,
    embeddings?: Map<string, number[]>
  ): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];

    if (!embeddings) {
      embeddings = await this.extractNoteEmbeddingsBatch([targetNote, ...candidateNotes]);
    }

    const targetEmbedding = embeddings.get(targetNote.id);
    if (!targetEmbedding) {
      throw new Error('Target note embedding not found');
    }

    for (const candidate of candidateNotes) {
      const candidateEmbedding = embeddings.get(candidate.id);
      if (!candidateEmbedding) {
        continue;
      }

      const similarity = this.cosineSimilarity(targetEmbedding, candidateEmbedding);
      if (similarity >= threshold) {
        results.push({
          noteId: candidate.id,
          score: similarity
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  async suggestConnectionsBatch(
    notes: Note[],
    threshold: number = 0.6,
    maxConnections: number = 5
  ): Promise<ConnectionSuggestion[]> {
    const embeddings = await this.extractNoteEmbeddingsBatch(notes);
    const suggestions: ConnectionSuggestion[] = [];

    for (let i = 0; i < notes.length; i++) {
      const sourceEmbedding = embeddings.get(notes[i].id);
      if (!sourceEmbedding) continue;

      const similarities: { index: number; score: number }[] = [];

      for (let j = 0; j < notes.length; j++) {
        if (i === j) continue;

        const targetEmbedding = embeddings.get(notes[j].id);
        if (!targetEmbedding) continue;

        const similarity = this.cosineSimilarity(sourceEmbedding, targetEmbedding);
        if (similarity >= threshold) {
          similarities.push({ index: j, score: similarity });
        }
      }

      similarities.sort((a, b) => b.score - a.score);

      for (let k = 0; k < Math.min(similarities.length, maxConnections); k++) {
        const targetIndex = similarities[k].index;
        suggestions.push({
          sourceId: notes[i].id,
          targetId: notes[targetIndex].id,
          score: similarities[k].score,
          reason: 'semantic_similarity'
        });
      }
    }

    return suggestions;
  }

  async generateConnectionExplanation(
    note1: Note,
    note2: Note,
    similarity: number
  ): Promise<string> {
    const request: ChatCompletionRequest = {
      model: this.config.chatModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains relationships between notes. Provide a concise one-sentence explanation.'
        },
        {
          role: 'user',
          content: `Explain why these two notes are connected with a similarity score of ${similarity.toFixed(2)}: Note 1: "${note1.title} - ${note1.content.substring(0, 200)}..." Note 2: "${note2.title} - ${note2.content.substring(0, 200)}..."`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    };

    const response = await this.fetchWithRetry<ChatCompletionResponse>(
      `${this.config.endpoint}/v1/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    );

    if (response.choices.length === 0) {
      throw new Error('No completion choices returned from API');
    }

    return response.choices[0].message.content.trim();
  }

  async processBatchWithRetry<T, R>(
    batch: BatchRequest<T>,
    processor: (items: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const batchSize = batch.batchSize || 10;
    const results: R[] = [];

    for (let i = 0; i < batch.items.length; i += batchSize) {
      const chunk = batch.items.slice(i, i + batchSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
    }

    return results;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry<any>(
        `${this.config.endpoint}/health`,
        { method: 'GET' }
      );
      return true;
    } catch {
      try {
        await this.fetchWithRetry<any>(
          `${this.config.endpoint}/v1/models`,
          { method: 'GET' }
        );
        return true;
      } catch {
        return false;
      }
    }
  }

  async getAvailableModels(): Promise<any> {
    return this.fetchWithRetry<any>(
      `${this.config.endpoint}/v1/models`,
      { method: 'GET' }
    );
  }

  updateConfig(partialConfig: Partial<NIMConfig>): void {
    this.config = { ...this.config, ...partialConfig };
  }

  updateRetryConfig(partialConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...partialConfig };
  }

  getConfig(): NIMConfig {
    return { ...this.config };
  }

  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

export {
  NIMService
};

export type {
  NIMConfig,
  EmbeddingRequest,
  EmbeddingResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  BatchRequest,
  RetryConfig,
  Note,
  SimilarityResult,
  ConnectionSuggestion
};
