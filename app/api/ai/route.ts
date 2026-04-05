import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const aiSchema = z.object({
  action: z.enum(["generate", "improve", "summarize", "explain"]),
  topic: z.string().optional(),
  text: z.string().optional(),
  code: z.string().optional(),
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from AI";
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, topic, text, code } = aiSchema.parse(body);

    let prompt = "";
    let result = "";

    switch (action) {
      case "generate":
        prompt = `Generate comprehensive documentation for the following topic:\n\n${topic}\n\nInclude code examples and explanations.`;
        result = await callOpenAI(prompt);
        break;
      case "improve":
        prompt = `Improve and enhance the following text for better clarity and professionalism:\n\n${text}`;
        result = await callOpenAI(prompt);
        break;
      case "summarize":
        prompt = `Summarize the following content concisely:\n\n${text}`;
        result = await callOpenAI(prompt);
        break;
      case "explain":
        prompt = `Explain the following code in detail:\n\n${code}`;
        result = await callOpenAI(prompt);
        break;
    }

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
