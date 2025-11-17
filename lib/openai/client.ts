import OpenAI from "openai";

let client: OpenAI | null = null;

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }
  return key;
}

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: getApiKey(),
    });
  }
  return client;
}

