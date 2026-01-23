import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "../../middlewares/auth";

class AiController {
  public router = Router();
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initializeRoutes();
  }

  private extractJson(text: string) {
    try {
      // Clean the text from markdown code blocks
      let cleaned = text.trim();
      if (cleaned.includes("```json")) {
        cleaned = cleaned.split("```json")[1].split("```")[0];
      } else if (cleaned.includes("```")) {
        cleaned = cleaned.split("```")[1].split("```")[0];
      }
      return JSON.parse(cleaned.trim());
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  private initializeRoutes() {
    this.router.post("/ai/generate", verifyToken, this.generatePost);
    this.router.post("/ai/summarize", verifyToken, this.summarizePost);
    this.router.post("/ai/expand", verifyToken, this.expandPost);
    this.router.post("/ai/tags", verifyToken, this.generateTags);
    this.router.post("/ai/fact-check", verifyToken, this.factCheckPost);
    this.router.post("/ai/translate", verifyToken, this.translatePost);
  }

  private factCheckPost = async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Fact-check the following post content. 
      Identify specific claims and determine if they are likely true, misleading, or false based on available knowledge.
      Also provide a confidence score and sources/explanations for each finding.
      Content: "${content.substring(0, 5000)}"
      Respond ONLY with a JSON object in the following format:
      {
        "overallVerification": "True | Mostly True | Mixture | Mostly False | False",
        "analysis": "A brief overview of the fact-checking results",
        "findings": [
          {
            "claim": "The specific claim being checked",
            "status": "True | False | Misleading | Unverifiable",
            "explanation": "Why this status was given"
          }
        ],
        "confidence": 0.0 to 1.0
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const factData = this.extractJson(text);
      res.json(factData);
    } catch (error) {
      console.error("AI Fact-check Error:", error);
      res.status(500).json({ error: "Failed to fact-check post" });
    }
  };

  private translatePost = async (req: Request, res: Response) => {
    try {
      const { content, targetLanguage } = req.body;
      if (!content || !targetLanguage) {
        return res
          .status(400)
          .json({ error: "Content and targetLanguage are required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Translate the following Markdown content into ${targetLanguage}.
      Preserve all Markdown formatting exactly. Return the title and the content clearly.
      Content: "${content.substring(0, 10000)}"
      Respond ONLY with a JSON object in the following format:
      {
        "translatedContent": "string (the fully translated markdown content)",
        "language": "string (target language)"
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const transData = this.extractJson(text);
      res.json(transData);
    } catch (error) {
      console.error("AI Translation Error:", error);
      res.status(500).json({ error: "Failed to translate post" });
    }
  };

  private generatePost = async (req: Request, res: Response) => {
    try {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Write a detailed blog post about "${topic}" in Markdown format. 
      Also provide a catchy title, a short excerpt (summary), and SEO keywords.
      Respond ONLY with a JSON object in the following format:
      {
        "title": "string",
        "content": "string (markdown content)",
        "excerpt": "string",
        "keywords": ["tag1", "tag2", ...]
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const postData = this.extractJson(text);
      res.json(postData);
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate post" });
    }
  };

  private summarizePost = async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Summarize the following post content. 
      Provide a TL;DR and key points as bullet points.
      Content: "${content.substring(0, 5000)}"
      Respond ONLY with a JSON object in the following format:
      {
        "summary": "string",
        "tldr": "string",
        "keyPoints": ["point1", "point2", ...]
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const summaryData = this.extractJson(text);
      res.json(summaryData);
    } catch (error) {
      console.error("AI Summary Error:", error);
      res.status(500).json({ error: "Failed to summarize post" });
    }
  };

  private expandPost = async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Expand the following post content. Add more details, examples, and depth while maintaining the original tone. 
      Content: "${content.substring(0, 5000)}"
      Respond ONLY with a JSON object in the following format:
      {
        "expandedContent": "string (markdown format)"
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const expandData = this.extractJson(text);
      res.json(expandData);
    } catch (error) {
      console.error("AI Expand Error:", error);
      res.status(500).json({ error: "Failed to expand post" });
    }
  };

  private generateTags = async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Analyze the following content and provide relevant tags and a category.
      Content: "${content.substring(0, 3000)}"
      Respond ONLY with a JSON object in the following format:
      {
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "category": "string"
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const tagData = this.extractJson(text);
      res.json(tagData);
    } catch (error) {
      console.error("AI Tag Generation Error:", error);
      res.status(500).json({ error: "Failed to generate tags" });
    }
  };
}

export default AiController;
