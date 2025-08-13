"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

const optimizePromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().min(1, "Model is required"),
  inputImage: z.string().optional(),
  isImageEditing: z.boolean().optional(),
});

type OptimizePromptInput = z.infer<typeof optimizePromptSchema>;
type OptimizePromptOutput = {
  success: boolean;
  optimizedPrompt?: string;
  error?: string;
};

const handler = async (data: OptimizePromptInput): Promise<OptimizePromptOutput> => {
  try {
    const { prompt, model, inputImage, isImageEditing } = data;

    // Verificar se a API key do OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "OpenAI API key not configured",
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert AI prompt engineer specializing in image generation. Your task is to optimize prompts for the ${model} model to achieve the best possible results. 

${isImageEditing ? 'IMPORTANT: This is for IMAGE EDITING, not generation from scratch. The user has uploaded an existing image and wants to edit/modify it. Focus on editing instructions that work well with the uploaded image.' : 'This is for image generation from scratch.'}

Guidelines:
- Transform the user's prompt into a detailed, descriptive English prompt
- ${isImageEditing ? 'Focus on editing instructions (add, remove, change, modify elements)' : 'Include specific details about lighting, composition, style, and quality'}
- Use artistic and technical terms that work well with AI image ${isImageEditing ? 'editing' : 'generation'}
- Keep the essence and intent of the original prompt
- Make it concise but descriptive
- Focus on visual elements that will produce high-quality results

Respond ONLY with the optimized prompt in English, nothing else.`
          },
          {
            role: "user",
            content: `${isImageEditing ? 'Image editing task' : 'Image generation task'}:
Original prompt: "${prompt}"
Model: ${model}${inputImage ? '\n\nNote: User has uploaded an image for editing.' : ''}

Optimize this prompt for the best ${isImageEditing ? 'image editing' : 'image generation'} results:`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return {
        success: false,
        error: `OpenAI API error: ${response.status} ${response.statusText}`,
      };
    }

    const data_response = await response.json();
    const optimizedPrompt = data_response.choices?.[0]?.message?.content?.trim();

    if (!optimizedPrompt) {
      return {
        success: false,
        error: "No optimized prompt received from OpenAI",
      };
    }

    return {
      success: true,
      optimizedPrompt,
    };
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const optimizePrompt = actionClient
  .schema(optimizePromptSchema)
  .action(async ({ parsedInput }) => {
    return await handler(parsedInput);
  });