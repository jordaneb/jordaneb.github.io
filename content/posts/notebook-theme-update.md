---
title: "Notebook styling update (lined paper + book spines)"
date: "2025-12-12"
description: "A quick style pass to make the site feel like a leather notebook with lined pages, plus a bookshelf-style post list."
tags: ["meta", "css", "design", "github-pages"]
---

Today I did a small style pass to give this site a bit more personality without turning it into “a design project”. I paired with an AI coding assistant and treated it like a fast implementation engine: I described the vibe and constraints, it did the wiring, and I kept steering until it felt right.

The target vibe was simple: **lined paper inside a leather notebook**, and a home page that feels like you’re looking at **book spines** rather than a typical card list.

## The changes

- The main layout is now a “notebook”: a leather outer frame, and a paper inner surface.
- The paper uses a CSS `repeating-linear-gradient` for horizontal lines and a subtle margin line.
- The home page list is now a set of “spines” — rows with leather texture, light edge wear, and small accent bands.

It’s all CSS — no images. That keeps it light and makes it easy to tweak.

## How it was done quickly

The only reason this was fast is feedback loops, and this is where the assistant really helped.

I ran the site locally and had the assistant use **Chrome MCP** to drive the browser while iterating on CSS. That meant I could:

- take full‑page screenshots instantly (desktop + mobile),
- resize the viewport to common breakpoints without guessing,
- inspect computed styles and element sizes programmatically.

That last part mattered when a responsiveness bug showed up: on small screens the “spines” overflowed the notebook page. Instead of eyeballing it, I had the assistant query computed styles and bounding boxes (container width vs. spine width), which made it obvious what was happening and where to fix it. No “try five random CSS tweaks and refresh” loop.

We also iterated on the spine text: the first pass used vertical text and it looked wrong for horizontal “books”, so we switched to a normal left‑to‑right title and adjusted spacing so the title and date don’t feel cramped.

The core fix is one of those CSS “you either know it or you don’t” moments:

```css
.book-spine-list {
  grid-template-columns: minmax(0, 1fr);
  overflow-x: hidden;
}

.book-spine-link,
.book-spine-title {
  min-width: 0;
}

.book-spine-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## Low stakes, low ceremony

I’m not pretending this is “perfectly architected CSS”. The stakes are low: it’s a personal site, and the worst‑case failure mode is “this looks a bit weird on a phone”.

That’s freeing. It means I can pick the simplest thing that works, ship it, and get back to writing instead of polishing a design system.
