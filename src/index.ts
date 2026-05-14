import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getPromptCategory,
  createEmbedding,
  getStandaloneQuestion,
  getFinalSystemPrompt,
  getTopKMatches,
  verifyPayloadMessages,
  getQueryResponse,
} from "./helpers";
import { GREETING_PROMPT } from "./constants";
import { PERSONAL_MESSAGE, PROHIBITED_MESSAGE, UI_URL } from "./config";

type Env = {
  Bindings: CloudflareBindings;
  Variables: {
    payload: { messages: { role: string; content: string }[] };
  };
};

const app = new Hono<Env>();

app.use(
  "/*",
  cors({
    origin: UI_URL,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Ask endpoint - handles all chat interactions
app.post("/ask", verifyPayloadMessages, async (c) => {
  const payload = c.get("payload");

  // Get the last message from the user and determine its category
  const lastMessage =
    payload.messages[payload.messages.length - 1]?.content || "";
  const category = await getPromptCategory(c, lastMessage);

  let systemPrompt = "";
  let finalQuery = lastMessage;

  if (category === "GREETING") {
    systemPrompt = GREETING_PROMPT;
  } else if (category === "PERSONAL") {
    return c.json({
      response: PERSONAL_MESSAGE,
      valid: false,
    });
  } else if (category === "PROHIBITED") {
    return c.json({
      response: PROHIBITED_MESSAGE,
      valid: false,
    });
  } else {
    // For PROFESSIONAL category, rewrite the query and get relevant context
    finalQuery = await getStandaloneQuestion(c, payload.messages);
    const queryEmbedding = await createEmbedding(c, finalQuery);
    const matches = await getTopKMatches(c, queryEmbedding, 3);

    if (matches.length === 0) {
      return c.json({
        response: "I don't know the answer for the question you've asked.",
        valid: false,
      });
    }

    systemPrompt = getFinalSystemPrompt(matches);
  }

  const result = await getQueryResponse(c, systemPrompt, payload.messages);
  return c.json({ response: result.response, valid: true });
});

// To add the vectors for the first time, run this endpoint once
// app.post("/upsert", async (c) => {
//   await upsertVectors(c.env);
//   return c.text("Vectors upserted successfully");
// });

export default app;
