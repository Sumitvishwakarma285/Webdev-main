require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");
const { BASE_PROMPT, getSystemPrompt } = require("./src/prompts");
const { basePrompt: nodeBasePrompt } = require("./src/defaults/node");
const { basePrompt: reactBasePrompt } = require("./src/defaults/react");

// Ensure API Key is available
if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY is missing in the .env file");
  process.exit(1);
}

// Initialize Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// app.post("/template", async (req, res) => {
//   try {
//     const prompt = req.body.prompt;
//     if (!prompt) {
//       return res.status(400).json({ error: "Prompt is required." });
//     }

//     // Call Groq API to determine project type (react or node)
//     const response = await groq.chat.completions.create({
//       messages: [{ role: "user", content: prompt }],
//       model: "llama3-8b-8192",
//       max_tokens: 200,
//       temperature: 0.6,
//       top_p: 1,
//     });

//     console.log("Groq API Response:", JSON.stringify(response, null, 2)); // Debugging log

//     if (!response || !response.choices || !response.choices[0]?.message?.content) {
//       return res.status(400).json({ error: "Invalid response from Groq API" });
//     }

//     const answer = response.choices[0].message.content.trim().toLowerCase(); // Normalize case

//     if (answer.includes("react")) {
//       return res.json({
//         prompts: [
//           BASE_PROMPT,
//           `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
//         ],
//         uiPrompts: [reactBasePrompt],
//       });
//     }

//     if (answer.includes("node")) {
//       return res.json({
//         prompts: [
//           `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
//         ],
//         uiPrompts: [nodeBasePrompt],
//       });
//     }

//     // If response isn't "react" or "node", return it for debugging
//     res.status(403).json({ message: "Invalid project type from Groq API", received: answer });
//   } catch (error) {
//     console.error("Error processing template request:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Auto-refine the user’s prompt
    const refinedPrompt = `Based on the following project description, which framework is most suitable? Respond with ONLY "react" or "node".  
    Do NOT provide any explanations or details.  

    Project Description: "${prompt}"`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: refinedPrompt }],
      model: "llama3-8b-8192",
      max_tokens: 10,
      temperature: 0.3,
      top_p: 0.8,
    });


    if (!response || !response.choices || !response.choices[0]?.message?.content) {
      return res.status(400).json({ error: "Invalid response from Groq API" });
    }

    const answer = response.choices[0].message.content.trim().toLowerCase();

    if (answer === "react") {
      return res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    if (answer === "node") {
      return res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    res.status(403).json({ message: "Invalid project type from Groq API", received: answer });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    // Call Groq API for chat completion
    const response = await groq.chat.completions.create({
      messages: messages,
      model: "deepseek-r1-distill-llama-70b",
      max_tokens: 8000,
      temperature: 0.7,
      top_p: 0.9,
    });

    if (!response || !response.choices || !response.choices[0]?.message?.content) {
      return res.status(400).json({ error: "Invalid response from Groq API" });
    }

    res.json({
      response: response.choices[0]?.message.content,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Graceful error handling for uncaught errors
process.on("uncaughtException", (err) => {
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
