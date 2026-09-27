import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['Complete', 'In Progress', 'Archived']).optional(),
    category: z.enum(['AI Engineering', 'Machine Learning', 'Optimization, Analysis & Data Engineering']).optional(),
    date: z.string().optional(),           // e.g. "2025-05"
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),  // pin to top of projects page
    image: z.string().optional(),
    award: z.string().optional(),          // e.g. "3rd Place, XYZ Hackathon" - shown as a highlight          // path relative to /public, e.g. "/images/raid-cover.jpg"
  }),
});

export const collections = { projects };
