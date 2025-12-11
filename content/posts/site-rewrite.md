---
title: "Rewriting this site (and why I kept it small)"
date: "2025-12-11"
description: "Notes on the GitHub Pages rewrite, the tiny generator, and the process that got me here."
tags: ["meta", "static-site", "typescript", "github-pages"]
---

I’ve rewritten this site again. The previous version was a little Django app that rendered Markdown from disk. It worked fine, but it was more moving parts than I wanted for a personal blog, and it tied deployment to my own infra. This rewrite is deliberately boring: a small TypeScript/Node static site generator that spits out a `dist/` folder for GitHub Pages.

That’s the whole point — low maintenance, easy to deploy, and easy to write.

## The goal

I wanted something just slightly more styled than my old homepage, but still minimal. The other big requirement was a private, Medium‑ish writing surface so I can draft posts quickly and save them as `.md` without pulling out a full CMS.

The idea was to keep the workflow:

1. Write Markdown.
2. Commit it.
3. Push.
4. Let Pages do the rest.

## The tools

This version is mostly plain TypeScript and a couple of boring libraries:

- **Node + TypeScript** (kept to a single generator script).
- **`gray-matter`** for frontmatter.
- **`markdown-it` + `markdown-it-anchor`** for Markdown rendering and heading links.
- **`highlight.js`** for code blocks.
- **`nunjucks`** for templates.
- A tiny split‑pane editor page that uses `marked` in the browser for live preview.

For the build itself, I used **Codex CLI** with **GPT‑5.2 (xhigh)** as a fast pairing partner. The model was useful for scaffolding and repetitive wiring while I stayed focused on direction and taste.

## The process

We started from an empty folder. First I pulled the HTML from my existing site so we could reuse the post list and basic content. From there:

1. Set up a Node/TS project and a one‑command build.
2. Build a tiny generator that:
   - reads Markdown from `content/posts` and `content/pages`,
   - parses frontmatter,
   - renders to HTML,
   - writes folder permalinks (`/posts/slug/`),
   - outputs `rss.xml` and `sitemap.xml`.
3. Create a minimal layout + CSS: good typography, soft cards on the home page, and just enough structure to feel intentional.
4. Convert the four existing posts into Markdown files and keep the audio embeds where they existed.
5. Add a hidden editor route (`/write-9c7f2a/`) with live preview, load/download `.md`, and autosave.
6. Add a GitHub Actions Pages deploy workflow.
7. Do a short taste pass: simplify About, set the accent to `#689ed4`, and add a couple of subtle lines/underlines to give the layout rhythm without making it busy.

Nothing exotic. The goal was to get back to writing, not to build a platform.

## What the tool handled vs what I handled

This is the part that matters if you’re curious about workflow.

- **I handled**
  - the requirements and the “keep it small” constraint,
  - deciding what “slightly more stylish” meant without drifting into a full theme,
  - choosing what to carry over from the old site,
  - the final passes on content and structure,
  - approving commits and the repo setup.

- **Codex/GPT‑5.2 handled**
  - scaffolding the generator and template plumbing,
  - writing the initial CSS and then iterating with my taste notes,
  - turning the old HTML posts into clean Markdown,
  - building the editor UI and wiring it into the build,
  - setting up the Pages workflow.

It felt like pairing with someone who can type the boring bits at lightspeed. You still need to be precise about intent, but the mechanical work disappears and you stay in the loop.

## Where this leaves me

The site is now a folder of Markdown and a generator that I understand in one sitting. That’s exactly where I want it. If I ever outgrow it, I can replace it without a migration project.

Back to writing.

This whole rewrite was really just an experiment to see how far these tools have come — a quick way to prove that a small, real site can be built end‑to‑end with a tight feedback loop and still feel like mine.

### Original prompt

```text
I want you to make me a github.io deployable website with a really minimal desing - I am wanting to write about electronic and programming. I would like a little medium-style editor for myself perhaps just hidden at a secret URL that lets me type and download MD files (and load them). It should basically be a mini static site generator. Using libraries is fine. I guess NodeJS will be the choice of language. TypeScript desired. nodenv is in the environment.

Here's my current: https://www.jordaneb.com/ - I want little more stylish than this but not much more. Just some visual distinction I suppose.

Use the links on my current site as starter content. My job title is Senior Full-Stack Engineer now.
```

— GPT 5.2 (xhigh) via Codex CLI on behalf of Jordan
