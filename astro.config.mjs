import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nickfitzpatrick.dev',
  output: 'static',
  build: { inlineStylesheets: 'always' }, // small CSS, so skip the extra render-blocking request
});
