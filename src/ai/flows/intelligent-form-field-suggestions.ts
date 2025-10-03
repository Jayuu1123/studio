'use server';

/**
 * @fileOverview Provides intelligent suggestions for form fields based on related data.
 *
 * - intelligentFormFieldSuggestions - A function that suggests form field values.
 * - IntelligentFormFieldSuggestionsInput - The input type for the intelligentFormFieldSuggestions function.
 * - IntelligentFormFieldSuggestionsOutput - The return type for the intelligentFormFieldSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentFormFieldSuggestionsInputSchema = z.object({
  fieldId: z.string().describe('The ID of the form field to provide suggestions for.'),
  fieldLabel: z.string().describe('The label of the form field.'),
  existingData: z.record(z.string(), z.any()).describe('A map of field IDs to their current values in the form.'),
  lookupData: z.array(z.record(z.string(), z.any())).optional().describe('Optional lookup table to provide suggestions from.'),
  numSuggestions: z.number().int().min(1).max(5).default(3).describe('The maximum number of suggestions to return.'),
});
export type IntelligentFormFieldSuggestionsInput = z.infer<
  typeof IntelligentFormFieldSuggestionsInputSchema
>;

const IntelligentFormFieldSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested values for the form field.'),
});
export type IntelligentFormFieldSuggestionsOutput = z.infer<
  typeof IntelligentFormFieldSuggestionsOutputSchema
>;

export async function intelligentFormFieldSuggestions(
  input: IntelligentFormFieldSuggestionsInput
): Promise<IntelligentFormFieldSuggestionsOutput> {
  return intelligentFormFieldSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentFormFieldSuggestionsPrompt',
  input: {
    schema: IntelligentFormFieldSuggestionsInputSchema,
  },
  output: {
    schema: IntelligentFormFieldSuggestionsOutputSchema,
  },
  prompt: `You are an AI assistant designed to provide intelligent suggestions for form fields to minimize manual entry and reduce errors.

  Based on the existing data entered in related fields, generate a list of suggestions for the specified field.

  Field ID: {{{fieldId}}}
  Field Label: {{{fieldLabel}}}
  Existing Data: {{#each existingData}}{{{@key}}}: {{{this}}}, {{/each}}
  {{#if lookupData}}
  Lookup Data (if available): {{JSON.stringify lookupData}}
  {{/if}}

  Provide {{{numSuggestions}}} suggestions for the field in an array of strings.
  Do not include any explanation or preamble. Only include the array.
  Ensure that suggestions are relevant to the existing data and the field being suggested.
  If you are using the lookup data, extract appropriate text suggestions from it.
  If you cannot provide suggestions based on the existing data return an empty array.
  `, // the end of the prompt.
});

const intelligentFormFieldSuggestionsFlow = ai.defineFlow(
  {
    name: 'intelligentFormFieldSuggestionsFlow',
    inputSchema: IntelligentFormFieldSuggestionsInputSchema,
    outputSchema: IntelligentFormFieldSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
