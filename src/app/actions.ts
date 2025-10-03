'use server';

import { intelligentFormFieldSuggestions } from "@/ai/flows/intelligent-form-field-suggestions";
import { z } from 'zod';

const FormStateSchema = z.record(z.string(), z.any());

export async function getSuggestionsAction(formState: z.infer<typeof FormStateSchema>, fieldId: string, fieldLabel: string) {
    try {
        const result = await intelligentFormFieldSuggestions({
            fieldId,
            fieldLabel,
            existingData: formState,
            numSuggestions: 3,
        });

        return {
            success: true,
            suggestions: result.suggestions,
        };
    } catch(error) {
        console.error("Error getting suggestions:", error);
        return {
            success: false,
            suggestions: [],
            error: "Failed to get suggestions."
        }
    }
}
