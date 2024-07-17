import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: '@gcoredev/fastedge-sdk-js',
      social: {
        github: 'https://github.com/G-Core/FastEdge-sdk-js',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'FastEdge', link: `/guides/fastedge/` },
            {
              label: 'FastEdge-sdk-js',
              link: `/guides/fastedge-sdk-js/`,
            },
            { label: 'Installation', link: `/guides/installation/` },
            { label: 'Creating a Wasm', link: `/guides/creating-a-wasm/` },
            { label: 'Building with config', link: `/guides/fastedge-init/` },
          ],
          collapsed: true,
        },
        {
          label: 'Examples',
          link: `/examples/main-examples/`,
        },
        {
          label: 'Reference',
          collapsed: true,
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
