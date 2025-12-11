# jordaneb.com static site

Minimal markdown‑driven site built for GitHub Pages.

## Quick start

```bash
npm install
npm run build
npm run dev
```

`npm run dev` serves `dist/` locally.

## Content

- Posts live in `content/posts/*.md`
- Pages (shown in the nav) live in `content/pages/*.md`

Frontmatter for posts:

```yaml
---
title: "Post title"
date: "2025-01-01"
description: "Optional summary"
tags: ["tag1", "tag2"]
slug: "optional-custom-slug"
audioUrl: "optional-mp3-url"
draft: false
---
```

Pages only need `title` and optional `slug`.

## Secret editor

A hidden markdown editor is generated at the path in `site.config.json`:

- `editorPath`: `"write-9c7f2a"` by default

Visit `/<editorPath>/` to write, load a `.md`, and download it. Nothing links to it in the site UI.

## Config

`site.config.json` controls site metadata and GitHub Pages paths:

- `basePath`: `""` for `username.github.io`, or `"repo-name"` for project pages
- `siteUrl`: used for RSS and sitemap

## Deploy to GitHub Pages

1. Push to `main`.
2. In GitHub repo settings → Pages → Source, select **GitHub Actions**.
3. Set `basePath` and `siteUrl` in `site.config.json` if needed.

The workflow builds `dist/` and deploys automatically.

