import { z } from 'zod';
import { TransactionType, Frequency } from '../../types';

// --- Enums & Primitives ---
export const TransactionTypeSchema = z.nativeEnum(TransactionType);
export const FrequencySchema = z.nativeEnum(Frequency);

// --- Base Entity Schemas ---
export const BaseEntitySchema = z.object({
    owner_id: z.string().optional(),
    updated_at: z.string().datetime().optional(),
    is_deleted: z.boolean().optional(),
});

// --- Transaction Schema ---
export const TransactionSchema = BaseEntitySchema.extend({
    id: z.string().uuid().or(z.string()), // Allow existing non-UUIDs during migration
    description: z.string().min(1, "Description is required"),
    amount: z.number().min(0, "Amount must be positive"),
    type: TransactionTypeSchema,
    date: z.string().datetime().or(z.string()), // Allow ISO strings
    category: z.string().min(1, "Category is required"),
    isExceptional: z.boolean().optional(),
});

export const TransactionInputSchema = TransactionSchema.omit({ id: true, updated_at: true, owner_id: true, is_deleted: true });

// --- Recurring Item Schema ---
export const RecurringItemSchema = BaseEntitySchema.extend({
    id: z.string(),
    description: z.string().min(1),
    amount: z.number().min(0),
    type: TransactionTypeSchema,
    category: z.string().optional(),
    isInstallment: z.boolean().optional(),
    totalInstallments: z.number().int().positive().optional(),
    startDate: z.string().datetime().optional(),
});

// --- User Settings Schema ---
export const UserSettingsSchema = BaseEntitySchema.extend({
    id: z.string(),
    custom_categories: z.array(z.string()),
    savings_goal: z.number().min(0),
    currency: z.string().length(3).optional(),
    openai_api_key: z.string().optional(), // We might want to validate pattern sk-...
});

// --- AI Response Schemas ---
export const AIParseResultSchema = z.object({
    type: z.enum(['EXPENSE', 'INCOME']),
    amount: z.number(),
    description: z.string(),
    category: z.string(),
    isInstallment: z.boolean().default(false),
    totalInstallments: z.number().optional(),
    startDate: z.string().optional(),
});
