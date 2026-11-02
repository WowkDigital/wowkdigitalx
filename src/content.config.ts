import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const optionalText = z.preprocess(value => value === '' || value === null ? undefined : value, z.string().optional());

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(250),
    date: z.coerce.date(),
    draft: z.boolean().default(true),
    type: z.enum(['note', 'article', 'gallery']).default('note'),
    slug: z.preprocess(value => value === '' || value === null ? undefined : value, z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()),
    cover: z.preprocess(value => value === '' || value === null ? undefined : value, z.string().startsWith('/images/').optional()),
    coverAlt: optionalText,
    tags: z.preprocess(value => value === null ? [] : value, z.array(z.string().min(1).max(40)).max(8).default([])),
    gallery: z.preprocess(value => value === null ? [] : value, z.array(z.object({ image: z.string().startsWith('/images/'), alt: z.string().min(1), caption: optionalText })).default([])),
  }).refine(data => !data.cover || Boolean(data.coverAlt?.trim()), { message: 'A cover image requires descriptive coverAlt text.' }),
});
export const collections = { posts };
