'use server';

/**
 * @fileOverview A transaction code suggestion AI agent.
 *
 * - getTransactionCodeSuggestion - A function that suggests transaction codes based on user input.
 * - TransactionCodeSuggestionInput - The input type for the getTransactionCodeSuggestion function.
 * - TransactionCodeSuggestionOutput - The return type for the getTransactionCodeSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionCodeSuggestionInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task the user is trying to complete.'),
});
export type TransactionCodeSuggestionInput = z.infer<
  typeof TransactionCodeSuggestionInputSchema
>;

const TransactionCodeSuggestionOutputSchema = z.object({
  suggestedCode: z
    .string()
    .describe('The suggested transaction code for the task.'),
  confidence: z.number().describe('The confidence level in the suggestion.'),
  reason: z
    .string()
    .describe('The reasoning behind the transaction code suggestion.'),
});
export type TransactionCodeSuggestionOutput = z.infer<
  typeof TransactionCodeSuggestionOutputSchema
>;

export async function getTransactionCodeSuggestion(
  input: TransactionCodeSuggestionInput
): Promise<TransactionCodeSuggestionOutput> {
  return transactionCodeSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transactionCodeSuggestionPrompt',
  input: {schema: TransactionCodeSuggestionInputSchema},
  output: {schema: TransactionCodeSuggestionOutputSchema},
  prompt: `You are an expert in enterprise resource planning (ERP) systems, skilled at recommending the most appropriate transaction codes based on a user's described task.

  Given the task: {{{taskDescription}}}, suggest the most relevant transaction code. Also, provide a confidence level (0-1) and a reason for your suggestion.

  Format your repsonse as follows:
  {
    "suggestedCode": "<code>",
    "confidence": <confidence_level>,
    "reason": "<reasoning>"
  }`,
});

const transactionCodeSuggestionFlow = ai.defineFlow(
  {
    name: 'transactionCodeSuggestionFlow',
    inputSchema: TransactionCodeSuggestionInputSchema,
    outputSchema: TransactionCodeSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
