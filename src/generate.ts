import fs from "node:fs/promises"
import path from "node:path"
import nunjucks from "nunjucks"
import matter from "gray-matter"
import MarkdownIt from "markdown-it"
import anchor from "markdown-it-anchor"
import hljs from "highlight.js"

type SiteConfig = {
  title: string
  description: string
  author: string
  jobTitle: string
  basePath: string
  editorPath: string
  githubUrl: string
  siteUrl: string
}

type PostFrontmatter = {
  title: string
  date: string
  description?: string
  tags?: string[]
  slug?: string
  draft?: boolean
  audioUrl?: string
}

type Post = {
  title: string
  date: Date
  dateLabel: string
  dateIso: string
  dateUtc: string
  description?: string
  tags: string[]
  slug: string
  url: string
  html: string
  audioUrl?: string
}

type PageFrontmatter = {
  title: string
  slug?: string
}

type Page = {
  title: string
  slug: string
  url: string
  html: string
}

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, "content")
const distRoot = path.join(projectRoot, "dist")
const templatesRoot = path.join(projectRoot, "src", "templates")
const staticRoot = path.join(projectRoot, "src", "static")

async function loadSiteConfig(): Promise<SiteConfig> {
  const configPath = path.join(projectRoot, "site.config.json")
  const raw = await fs.readFile(configPath, "utf8")
  const data = JSON.parse(raw)
  return {
    title: data.title ?? "Site",
    description: data.description ?? "",
    author: data.author ?? "",
    jobTitle: data.jobTitle ?? "",
    basePath: data.basePath ?? "",
    editorPath: data.editorPath ?? "write",
    githubUrl: data.githubUrl ?? "",
    siteUrl: data.siteUrl ?? ""
  }
}

function normalizeBasePath(basePath: string) {
  const trimmed = basePath.trim()
  if (!trimmed) return ""
  return "/" + trimmed.replace(/^\/+|\/+$/g, "")
}

function joinUrl(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map(part => part.replace(/^\/+|\/+$/g, ""))
    .join("/")
    .replace(/^/, "/")
}

function createMarkdownRenderer() {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code, language) {
      if (language && hljs.getLanguage(language)) {
        const highlighted = hljs.highlight(code, { language }).value
        return `<pre class="hljs"><code>${highlighted}</code></pre>`
      }
      const escaped = markdown.utils.escapeHtml(code)
      return `<pre class="hljs"><code>${escaped}</code></pre>`
    }
  })
  markdown.use(anchor, { permalink: anchor.permalink.linkInsideHeader({ symbol: "#" }) })
  return markdown
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }
  return files
}

function inferSlug(filePath: string) {
  return path.basename(filePath, ".md")
}

function parseDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date)
}

async function readPosts(site: SiteConfig, markdown: MarkdownIt): Promise<Post[]> {
  const postsDir = path.join(contentRoot, "posts")
  const files = await listMarkdownFiles(postsDir)
  const basePath = normalizeBasePath(site.basePath)

  const posts: Post[] = []
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8")
    const parsed = matter(raw)
    const fm = parsed.data as PostFrontmatter
    if (fm.draft) continue
    const slug = fm.slug ?? inferSlug(file)
    const date = new Date(fm.date)
    const dateIso = date.toISOString()
    const dateUtc = date.toUTCString()
    const html = markdown.render(parsed.content)
    const url = joinUrl(basePath, "posts", slug) + "/"
    posts.push({
      title: fm.title ?? slug,
      date,
      dateLabel: parseDateLabel(date),
      dateIso,
      dateUtc,
      description: fm.description,
      tags: fm.tags ?? [],
      slug,
      url,
      html,
      audioUrl: fm.audioUrl
    })
  }

  posts.sort((a, b) => b.date.getTime() - a.date.getTime())
  return posts
}

async function readPages(site: SiteConfig, markdown: MarkdownIt): Promise<Page[]> {
  const pagesDir = path.join(contentRoot, "pages")
  let files: string[] = []
  try {
    files = await listMarkdownFiles(pagesDir)
  } catch {
    return []
  }
  const basePath = normalizeBasePath(site.basePath)
  const pages: Page[] = []

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8")
    const parsed = matter(raw)
    const fm = parsed.data as PageFrontmatter
    const slug = fm.slug ?? inferSlug(file)
    const html = markdown.render(parsed.content)
    const url = joinUrl(basePath, slug) + "/"
    pages.push({ title: fm.title ?? slug, slug, html, url })
  }

  return pages
}

async function emptyDirectory(target: string) {
  await fs.rm(target, { recursive: true, force: true })
  await fs.mkdir(target, { recursive: true })
}

async function copyStatic() {
  await fs.mkdir(path.join(distRoot, "assets"), { recursive: true })
  const staticEntries = await fs.readdir(staticRoot, { withFileTypes: true })
  for (const entry of staticEntries) {
    const from = path.join(staticRoot, entry.name)
    const to = path.join(distRoot, "assets", entry.name)
    if (entry.isFile()) {
      await fs.copyFile(from, to)
    }
  }
}

async function writeFile(targetPath: string, contents: string) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, contents, "utf8")
}

async function buildSite() {
  const site = await loadSiteConfig()
  const markdown = createMarkdownRenderer()
  const basePath = normalizeBasePath(site.basePath)
  const nunjucksEnvironment = nunjucks.configure(templatesRoot, { autoescape: false })

  await emptyDirectory(distRoot)
  await copyStatic()

  const posts = await readPosts(site, markdown)
  const pages = await readPages(site, markdown)

  const templateData = { site, basePath, posts, pages, currentYear: new Date().getFullYear() }

  const homeHtml = nunjucksEnvironment.render("home.njk", { ...templateData, pageTitle: site.title })
  await writeFile(path.join(distRoot, "index.html"), homeHtml)

  for (const post of posts) {
    const postHtml = nunjucksEnvironment.render("post.njk", { ...templateData, pageTitle: post.title, post })
    await writeFile(path.join(distRoot, "posts", post.slug, "index.html"), postHtml)
  }

  for (const page of pages) {
    const pageHtml = nunjucksEnvironment.render("page.njk", { ...templateData, pageTitle: page.title, page })
    await writeFile(path.join(distRoot, page.slug, "index.html"), pageHtml)
  }

  const editorHtml = nunjucksEnvironment.render("editor.njk", { ...templateData, pageTitle: "Write" })
  await writeFile(path.join(distRoot, site.editorPath, "index.html"), editorHtml)

  const rssXml = nunjucksEnvironment.render("rss.njk", { ...templateData, posts })
  await writeFile(path.join(distRoot, "rss.xml"), rssXml)

  const sitemapXml = nunjucksEnvironment.render("sitemap.njk", { ...templateData, posts, pages })
  await writeFile(path.join(distRoot, "sitemap.xml"), sitemapXml)
}

await buildSite()
