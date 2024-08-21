import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://g-core.github.io',
  base: '/FastEdge-sdk-js',
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
            { label: 'FastEdge', link: `${import.meta.env.BASE_URL}guides/fastedge/` },
            {
              label: 'FastEdge-sdk-js',
              link: `${import.meta.env.BASE_URL}guides/fastedge-sdk-js/`,
            },
            { label: 'Installation', link: `${import.meta.env.BASE_URL}guides/installation/` },
            {
              label: 'Creating a Wasm',
              link: `${import.meta.env.BASE_URL}guides/creating-a-wasm/`,
            },
            {
              label: 'Building with config',
              link: `${import.meta.env.BASE_URL}guides/fastedge-init/`,
            },
          ],
          collapsed: true,
        },
        {
          label: 'Examples',
          link: `${import.meta.env.BASE_URL}examples/main-examples/`,
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
