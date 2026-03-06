import { html } from "hono/html";

interface SiteData {
  title: string;
  description: string;
  children?: any;
}

const Layout = (props: SiteData) => html`
  <html prefix="og: http://ogp.me/ns#">
    <head>
      <meta charset="UTF-8" />
      <title>${props.title}</title>
      <meta name="description" content="${props.description}" />
      <meta property="og:type" content="article" />
      <!-- More elements slow down JSX, but not template literals. -->
      <meta property="og:title" content="${props.title}" />
      <link rel="stylesheet" href="/styles/index.css" />
    </head>
    <body>
      ${props.children}
    </body>
  </html>
`;

const Footer = () => (
  <footer>
    <p>
      FastEdge Examples. Built with
      <a href="https://hono.dev" target="_blank">
        Hono
      </a>{" "}
      and
      <a href="https://gcore.com/fastedge" target="_blank">
        FastEdge
      </a>
      .
    </p>
  </footer>
);

const JsxContent = (props: { siteData: SiteData; name: string }) => (
  <Layout {...props.siteData}>
    <h1>JSX rendered Page</h1>
    <h3>Hello {props.name}</h3>
    <p>
      This is the JSX rendered page. Example of how to use Hono html rendering.
    </p>
    <a href="https://hono.dev/docs/helpers/html#html" target="_blank">
      Hono HTML Helper Documentation
    </a>
    <div class="home-nav">
      <a href="/">
        <img src="/images/home.png" alt="Home Button" />
      </a>
    </div>
    <Footer />
  </Layout>
);

export { JsxContent };
