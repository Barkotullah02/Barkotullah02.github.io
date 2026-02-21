# Barkotullah Opu Portfolio

SEO-polished static portfolio for GitHub Pages.

## Automated SEO Workflow

This project now uses a source-driven SEO build pipeline:

- Source of truth: `data/posts.json`
- Generator: `scripts/build-seo.mjs`
- Output:
	- post listing cards in `dev-daily.html`
	- dedicated post pages in `posts/*.html`
	- static JSON-LD in `dev-daily.html`
	- refreshed `sitemap.xml` and `sitemap_1.xml`
	- generated RSS feed in `rss.xml`

### Add a New Post

1. Add a new object to `data/posts.json` (unique `id` and `slug`).
2. Include `title`, `summary`, `datePublished`, `dateModified`, optional `image`, `imageAlt`, and section content.
3. Run:

```bash
npm run build:seo
```

4. Commit generated changes (`dev-daily.html`, `posts/*`, sitemap files).

### GitHub Actions Auto-Generation

On push to `main`, workflow `.github/workflows/seo-build.yml` runs the generator and auto-commits generated SEO artifacts if needed.

## Publish on GitHub Pages

1. Push this project to repository root of `Barkotullah02/Barkotullah02.github.io`.
2. In GitHub, open **Settings → Pages**.
3. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**.
4. Wait for deployment and verify site is live at `https://barkotullah02.github.io/`.

## SEO Checklist After Deploy

- Open `https://barkotullah02.github.io/robots.txt`
- Open `https://barkotullah02.github.io/sitemap.xml`
- Test structured data in Google Rich Results Test
- Add property in Google Search Console
- Submit sitemap: `https://barkotullah02.github.io/sitemap.xml`
- Request indexing for homepage

## Important Personalization

Before public launch, replace placeholders in `index.html`:

- "Add your public email"
- Social links still set to `#` for LinkedIn, Twitter, YouTube, Behance

Updating those links improves trust and search performance.

## Notes

- `dev-daily.html` contains generator markers (`BLOG-JSONLD` and `POSTS-LIST`) and should not be manually edited inside those marker blocks.
- Use real profile/contact links in `index.html` to improve branded search quality.
