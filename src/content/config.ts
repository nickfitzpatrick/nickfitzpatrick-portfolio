import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['Complete', 'In Progress', 'Archived']).optional(),
    date: z.string().optional(),           // e.g. "2025-05"
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),  // pin to top of projects page
  }),
});

export const collections = { projects };
