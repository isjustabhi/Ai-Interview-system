import OpenAI from "openai";

export const client =
  process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    : null;

export async function safeJsonCompletion<T>(system: string, user: string, fallback: T): Promise<T> {
  if (!client) return fallback;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });
    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    // Surface provider issues in server logs so fallback behavior is debuggable.
    console.error("OpenAI completion failed:", error);
    return fallback;
  }
}