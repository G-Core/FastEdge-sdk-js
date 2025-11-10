import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://g-core.github.io',
  base: '/FastEdge-sdk-js',
  integrations: [
    starlight({
      title: '@gcoredev/fastedge-sdk-js',
      customCss: ['./src/styles/custom.css'],
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
            {
              label: 'Serving a static site',
              link: `${import.meta.env.BASE_URL}guides/serving-a-static-site/`,
            },
            {
              label: 'Creating static assets',
              link: `${import.meta.env.BASE_URL}guides/creating-a-static-manifest/`,
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
          items: [
            {
              label: 'Overview',
              link: `${import.meta.env.BASE_URL}reference/overview/`,
            },
            {
              label: 'FastEdge::env',
              link: `${import.meta.env.BASE_URL}reference/fastedge/env/`,
            },
            {
              label: 'FastEdge::secret',
              collapsed: true,
              items: [
                {
                  label: 'getSecret',
                  link: `${import.meta.env.BASE_URL}reference/fastedge/secret/get-secret/`,
                },
                {
                  label: 'getSecretEffectiveAt',
                  link: `${
                    import.meta.env.BASE_URL
                  }reference/fastedge/secret/get-secret-effective-at/`,
                },
              ],
            },
            {
              label: 'FastEdge::kv',
              collapsed: true,
              items: [
                {
                  label: 'KvStore.open()',
                  link: `${import.meta.env.BASE_URL}reference/fastedge/kv/open/`,
                },
                {
                  label: 'KV Instance',
                  collapsed: true,
                  items: [
                    {
                      label: 'get / scan',
                      link: `${import.meta.env.BASE_URL}reference/fastedge/kv/key-value/`,
                    },
                    {
                      label: 'zrange / zscan',
                      link: `${import.meta.env.BASE_URL}reference/fastedge/kv/zset/`,
                    },
                    {
                      label: 'bfExists',
                      link: `${import.meta.env.BASE_URL}reference/fastedge/kv/bloom-filter/`,
                    },
                  ],
                },
              ],
            },
            {
              label: 'Headers',
              link: `${import.meta.env.BASE_URL}reference/headers/`,
            },
            {
              label: 'Request',
              link: `${import.meta.env.BASE_URL}reference/request/`,
            },
            {
              label: 'Response',
              link: `${import.meta.env.BASE_URL}reference/response/`,
            },
          ],
        },
        {
          label: 'Migrating',
          collapsed: true,
          autogenerate: { directory: 'migrating' },
        },
      ],
    }),
  ],
});
