import { defineConfig } from "vitepress";

export default defineConfig({
  title: "PKP",
  description: "Product Knowledge Protocol - Open standard for AI agent product knowledge",

  ignoreDeadLinks: [
    /^http:\/\/localhost/,
  ],

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/format" },
      { text: "CLI", link: "/cli/overview" },
      { text: "MCP Servers", link: "/mcp/catalog-server" },
      {
        text: "v0.1.0",
        items: [
          { text: "Changelog", link: "https://github.com/kodda-ai/pkp/blob/main/CHANGELOG.md" },
          { text: "Contributing", link: "https://github.com/kodda-ai/pkp/blob/main/CONTRIBUTING.md" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is PKP?", link: "/guide/what-is-pkp" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Architecture", link: "/guide/architecture" },
            { text: "PRODUCT.md Format", link: "/guide/product-format" },
            { text: "Categories", link: "/guide/categories" },
            { text: "Confidence Levels", link: "/guide/confidence" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Specification",
          items: [
            { text: "Format Overview", link: "/reference/format" },
            { text: "Schema Reference", link: "/reference/schema" },
            { text: "Category Schemas", link: "/reference/categories" },
          ],
        },
      ],
      "/cli/": [
        {
          text: "CLI",
          items: [
            { text: "Overview", link: "/cli/overview" },
            { text: "pkp init", link: "/cli/init" },
            { text: "pkp validate", link: "/cli/validate" },
            { text: "pkp build", link: "/cli/build" },
            { text: "pkp serve", link: "/cli/serve" },
            { text: "pkp generate", link: "/cli/generate" },
          ],
        },
      ],
      "/mcp/": [
        {
          text: "MCP Servers",
          items: [
            { text: "Catalog Server", link: "/mcp/catalog-server" },
            { text: "Registry Server", link: "/mcp/registry-server" },
            { text: "Skills", link: "/mcp/skills" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/kodda-ai/pkp" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2024-present Kodda.ai",
    },

    search: {
      provider: "local",
    },
  },
});
