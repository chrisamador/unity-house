declare module 'openai' {
  interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  interface ChatCompletionChoice {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }

  interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }

  interface ChatCompletionOptions {
    model: string;
    messages: ChatCompletionMessage[];
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  }

  class OpenAIApi {
    constructor(options: { apiKey: string });
    chat: {
      completions: {
        create(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
      };
    };
  }

  export default OpenAIApi;
}
