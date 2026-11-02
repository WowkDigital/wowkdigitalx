import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://wowkdigitalx.pl',
  output: 'static',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap()],
  markdown: { processor: unified({ rehypePlugins: [rehypeSanitize] }) },
});
