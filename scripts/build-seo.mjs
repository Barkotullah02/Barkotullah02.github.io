import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const SITE_URL = 'https://barkotullah02.github.io';
const PERSON_ID = `${SITE_URL}/#person`;
const PERSON_NAME = 'Barkotullah Opu';
const PERSON_ALTERNATE_NAMES = ['Barkatullah Opu', 'Barkatullah', 'Opu'];
const PERSON_SAME_AS = [
  'https://www.linkedin.com/in/barkotullahopu',
  'https://github.com/Barkotullah02',
  'https://x.com/OnlymeOpu',
  'https://www.facebook.com/Only.meOpu',
  'https://www.instagram.com/xoaifa/'
];
const PERSON_X_HANDLE = '@OnlymeOpu';
const DEV_DAILY_PATH = path.join(root, 'dev-daily.html');
const POSTS_DATA_PATH = path.join(root, 'data', 'posts.json');
const POSTS_OUTPUT_DIR = path.join(root, 'posts');
const SITEMAP_PATH = path.join(root, 'sitemap.xml');
const SITEMAP_DUP_PATH = path.join(root, 'sitemap_1.xml');
const RSS_PATH = path.join(root, 'rss.xml');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toAbsoluteUrl(relativePath) {
  return new URL(relativePath, `${SITE_URL}/`).href;
}

function replaceBetweenMarkers(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Markers not found or invalid order: ${startMarker} ... ${endMarker}`);
  }

  const before = content.slice(0, start + startMarker.length);
  const after = content.slice(end);
  return `${before}\n${replacement}\n    ${after}`;
}

function toDateOnly(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function sortNewestFirst(posts) {
  return [...posts].sort((left, right) => {
    const leftDate = Date.parse(left.datePublished || '');
    const rightDate = Date.parse(right.datePublished || '');

    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return rightDate - leftDate;
    }

    if (!Number.isNaN(leftDate)) return -1;
    if (!Number.isNaN(rightDate)) return 1;
    return 0;
  });
}

function validatePosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('data/posts.json must contain at least one post.');
  }

  const ids = new Set();
  const slugs = new Set();

  posts.forEach((post, index) => {
    const required = ['id', 'slug', 'title', 'summary', 'datePublished', 'dateModified'];
    for (const key of required) {
      if (!post[key] || typeof post[key] !== 'string') {
        throw new Error(`Post at index ${index} is missing required string field: ${key}`);
      }
    }

    if (ids.has(post.id)) {
      throw new Error(`Duplicate post id found: ${post.id}`);
    }
    ids.add(post.id);

    if (slugs.has(post.slug)) {
      throw new Error(`Duplicate post slug found: ${post.slug}`);
    }
    slugs.add(post.slug);

    if (toDateOnly(post.datePublished) === null) {
      throw new Error(`Invalid datePublished for ${post.id}: ${post.datePublished}`);
    }

    if (toDateOnly(post.dateModified) === null) {
      throw new Error(`Invalid dateModified for ${post.id}: ${post.dateModified}`);
    }
  });
}

function renderTags(tags = []) {
  return tags
    .map((tag, index) => {
      const colorClass = index % 3 === 0
        ? 'bg-cyan-900/30 text-cyan-300'
        : index % 3 === 1
          ? 'bg-purple-900/30 text-purple-300'
          : 'bg-pink-900/30 text-pink-300';
      return `<span class="px-3 py-1 ${colorClass} rounded">${escapeHtml(tag)}</span>`;
    })
    .join('\n                    ');
}

function renderSections(sections = []) {
  return sections
    .map((section, index) => `
                <section class="${index < sections.length - 1 ? 'mb-5' : ''}">
                    <h4 class="font-gaming text-lg text-purple-300 mb-2">${index + 1}) ${escapeHtml(section.heading || 'Section')}</h4>
                    <p class="text-gray-400">${escapeHtml(section.body || '')}</p>
                </section>`)
    .join('');
}

function renderArticleCard(post, index) {
  const pageUrl = `posts/${post.slug}.html`;
  const imageBlock = post.image
    ? `
                <figure class="article-media mb-6">
                    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async">
                    ${post.imageCaption ? `<figcaption>${escapeHtml(post.imageCaption)}</figcaption>` : ''}
                </figure>`
    : '';

  const sectionsHtml = renderSections(post.sections || []);

  return `
            <article id="${escapeHtml(post.id)}" class="section-card p-8 rounded-lg${index > 0 ? ' mt-8' : ''}">
                <div class="flex flex-wrap items-center gap-3 text-xs mb-4">
                    <time datetime="${escapeHtml(post.datePublished)}" class="px-3 py-1 bg-gray-900 border border-gray-800 rounded text-cyan-300">${escapeHtml(post.datePublished)}</time>
                    ${renderTags(post.tags || [])}
                </div>

                <h3 class="text-2xl md:text-3xl font-gaming text-cyan-400 mb-3">${escapeHtml(post.title)}</h3>
                <p class="text-gray-300 mb-6"><strong>Summary:</strong> ${escapeHtml(post.summary)}</p>${imageBlock}${sectionsHtml}
                <div class="mt-6">
                    <a href="${escapeHtml(pageUrl)}" class="neon-button px-6 py-2 font-gaming text-sm uppercase inline-block">Read Dedicated Page</a>
                </div>
            </article>`;
}

function renderBlogJsonLd(posts) {
  const graph = [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: PERSON_NAME,
      alternateName: PERSON_ALTERNATE_NAMES,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/me_transparent.png`,
      sameAs: PERSON_SAME_AS
    },
    {
      '@type': 'Blog',
      '@id': `${SITE_URL}/dev-daily.html#blog`,
      name: 'Dev Daily',
      description: 'Dev journal and practical engineering notes by Barkotullah Opu.',
      url: `${SITE_URL}/dev-daily.html`,
      inLanguage: 'en',
      author: {
        '@id': PERSON_ID
      }
    },
    {
      '@type': 'ItemList',
      name: 'Dev Daily Articles',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/posts/${post.slug}.html`,
        name: post.title
      }))
    }
  ];

  posts.forEach((post) => {
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${SITE_URL}/posts/${post.slug}.html#blogposting`,
      headline: post.title,
      description: post.summary,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      mainEntityOfPage: `${SITE_URL}/posts/${post.slug}.html`,
      image: post.image ? toAbsoluteUrl(post.image) : undefined,
      author: {
        '@id': PERSON_ID
      },
      publisher: {
        '@type': 'Person',
        name: 'Barkotullah Opu'
      },
      isPartOf: {
        '@id': `${SITE_URL}/dev-daily.html#blog`
      }
    });
  });

  const cleanedGraph = graph.map((node) =>
    Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined))
  );

  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': cleanedGraph }, null, 2)}\n    </script>`;
}

function renderPostPage(post) {
  const canonical = `${SITE_URL}/posts/${post.slug}.html`;
  const imageUrl = post.image ? toAbsoluteUrl(post.image) : `${SITE_URL}/me_transparent.png`;
  const sectionsHtml = (post.sections || [])
    .map((section, index) => `
                <section class="${index < (post.sections || []).length - 1 ? 'mb-6' : ''}">
                    <h2 class="font-gaming text-2xl text-purple-300 mb-2">${index + 1}) ${escapeHtml(section.heading || 'Section')}</h2>
                    <p class="text-gray-300 leading-relaxed">${escapeHtml(section.body || '')}</p>
                </section>`)
    .join('');

  const tagHtml = (post.tags || [])
    .map((tag) => `<span class="px-3 py-1 bg-cyan-900/30 text-cyan-300 rounded text-xs">${escapeHtml(tag)}</span>`)
    .join('\n                        ');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Dev Daily',
        item: `${SITE_URL}/dev-daily.html`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonical
      }
    ]
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#blogposting`,
    headline: post.title,
    description: post.summary,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    mainEntityOfPage: canonical,
    image: imageUrl,
    author: {
      '@id': PERSON_ID
    },
    publisher: {
      '@type': 'Person',
      name: 'Barkotullah Opu'
    },
    isPartOf: {
      '@id': `${SITE_URL}/dev-daily.html#blog`
    }
  };

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON_NAME,
    alternateName: PERSON_ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/me_transparent.png`,
    sameAs: PERSON_SAME_AS
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(post.title)} | Dev Daily | Barkotullah Opu</title>
    <meta name="description" content="${escapeHtml(post.summary)}">
    <meta name="author" content="Barkotullah Opu">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="theme-color" content="#050505">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" type="application/rss+xml" title="Barkotullah Opu Dev Daily RSS" href="${SITE_URL}/rss.xml">

    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Barkotullah Opu Portfolio">
    <meta property="og:title" content="${escapeHtml(post.title)}">
    <meta property="og:description" content="${escapeHtml(post.summary)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:alt" content="${escapeHtml(post.imageAlt || post.title)}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(post.title)}">
    <meta name="twitter:description" content="${escapeHtml(post.summary)}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${escapeHtml(post.imageAlt || post.title)}">
    <meta name="twitter:creator" content="${PERSON_X_HANDLE}">
    <meta name="twitter:site" content="${PERSON_X_HANDLE}">

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">

    <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
    <script type="application/ld+json">${JSON.stringify(personJsonLd)}</script>
</head>
<body class="bg-black text-white">
    <canvas id="bg-canvas"></canvas>

    <nav class="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-cyan-900/50">
      <div class="flex items-center gap-2">
        <a href="../dev-daily.html" class="text-2xl font-bold font-gaming neon-text">Dev Daily</a>
        <a href="../rss.xml" aria-label="Subscribe to Dev Daily RSS" class="text-cyan-300 hover:text-cyan-400 transition text-sm px-2 py-1 rounded border border-cyan-700/70">
          <i class="fas fa-rss"></i>
        </a>
      </div>
        <div class="space-x-6 hidden lg:flex items-center text-xs font-gaming">
            <a href="../index.html" class="hover:text-cyan-400 transition">HOME</a>
            <a href="../dev-daily.html" class="hover:text-cyan-400 transition">ALL POSTS</a>
        <a href="../rss.xml" class="hover:text-cyan-400 transition">RSS</a>
        </div>
        <a href="../index.html#contact" class="neon-button px-6 py-2 font-gaming text-sm uppercase hidden md:block">Hire Me</a>
    </nav>

    <main class="pt-28 pb-16 px-6">
        <article class="max-w-4xl mx-auto section-card p-8 md:p-10 rounded-lg">
            <div class="flex flex-wrap items-center gap-3 text-xs mb-5">
                <time datetime="${escapeHtml(post.datePublished)}" class="px-3 py-1 bg-gray-900 border border-gray-800 rounded text-cyan-300">${escapeHtml(post.datePublished)}</time>
                ${tagHtml}
            </div>

            <h1 class="text-3xl md:text-5xl font-gaming text-cyan-400 mb-4">${escapeHtml(post.title)}</h1>
            <p class="text-gray-300 mb-8 leading-relaxed">${escapeHtml(post.summary)}</p>
            <p class="text-xs text-gray-500 mb-8">Author: Barkotullah Opu (also written as Barkatullah Opu).</p>

            ${post.image ? `<figure class="article-media mb-8">
                <img src="../${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async">
                ${post.imageCaption ? `<figcaption>${escapeHtml(post.imageCaption)}</figcaption>` : ''}
            </figure>` : ''}

            ${sectionsHtml}

            <div class="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
                <a href="../dev-daily.html#posts" class="neon-button px-6 py-3 font-gaming text-sm uppercase text-center">Back to Dev Daily</a>
                <a href="../index.html" class="px-6 py-3 border border-gray-700 hover:bg-gray-800 transition font-gaming text-sm uppercase text-center">Back to Home</a>
              <a href="../rss.xml" class="px-6 py-3 border border-cyan-700 hover:bg-cyan-900/20 transition font-gaming text-sm uppercase text-center">Subscribe RSS</a>
            </div>
        </article>
    </main>

    <script src="../script.js"></script>
</body>
</html>
`;
}

function renderSitemap(urlEntries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
  .join('\n')}
</urlset>
`;
}

function renderRssFeed(posts) {
  const latestTimestamp = posts.reduce((currentMax, post) => {
    const modified = Date.parse(post.dateModified || '');
    const published = Date.parse(post.datePublished || '');
    const candidate = Number.isNaN(modified)
      ? (Number.isNaN(published) ? currentMax : published)
      : modified;

    return Math.max(currentMax, candidate);
  }, Date.now());

  const itemsXml = posts.map((post) => {
    const link = `${SITE_URL}/posts/${post.slug}.html`;
    const guid = `${link}#${post.id}`;
    const pubDate = new Date(post.datePublished).toUTCString();
    const description = escapeHtml(post.summary);

    return `  <item>\n    <title>${escapeHtml(post.title)}</title>\n    <link>${link}</link>\n    <guid isPermaLink="false">${guid}</guid>\n    <pubDate>${pubDate}</pubDate>\n    <description>${description}</description>\n  </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Barkotullah Opu - Dev Daily</title>
  <link>${SITE_URL}/dev-daily.html</link>
  <description>Dev Daily posts by Barkotullah Opu on full stack development, React, Flutter, and shipping real products.</description>
  <language>en-us</language>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date(latestTimestamp).toUTCString()}</lastBuildDate>
  ${itemsXml}
</channel>
</rss>
`;
}

async function ensureCleanPostsDirectory() {
  await fs.mkdir(POSTS_OUTPUT_DIR, { recursive: true });
  const files = await fs.readdir(POSTS_OUTPUT_DIR);
  await Promise.all(
    files
      .filter((fileName) => fileName.endsWith('.html'))
      .map((fileName) => fs.unlink(path.join(POSTS_OUTPUT_DIR, fileName)))
  );
}

async function main() {
  const postsRaw = await fs.readFile(POSTS_DATA_PATH, 'utf8');
  const posts = JSON.parse(postsRaw);
  validatePosts(posts);

  const sortedPosts = sortNewestFirst(posts);
  const latestPost = sortedPosts[0];

  await ensureCleanPostsDirectory();

  for (const post of sortedPosts) {
    const html = renderPostPage(post);
    await fs.writeFile(path.join(POSTS_OUTPUT_DIR, `${post.slug}.html`), html, 'utf8');
  }

  let devDailyContent = await fs.readFile(DEV_DAILY_PATH, 'utf8');

  const postsListHtml = sortedPosts.map((post, index) => renderArticleCard(post, index)).join('\n');
  devDailyContent = replaceBetweenMarkers(devDailyContent, '<!-- POSTS-LIST:START -->', '<!-- POSTS-LIST:END -->', postsListHtml);

  const blogJsonLdScript = renderBlogJsonLd(sortedPosts);
  devDailyContent = replaceBetweenMarkers(devDailyContent, '<!-- BLOG-JSONLD:START -->', '<!-- BLOG-JSONLD:END -->', blogJsonLdScript);

  if (latestPost?.image) {
    const latestImage = toAbsoluteUrl(latestPost.image);
    const latestImageAlt = escapeHtml(latestPost.imageAlt || latestPost.title);

    devDailyContent = devDailyContent
      .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${latestImage}">`)
      .replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${latestImageAlt}">`)
      .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${latestImage}">`)
      .replace(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${latestImageAlt}">`);
  }

  await fs.writeFile(DEV_DAILY_PATH, devDailyContent, 'utf8');

  const listingLastMod = toDateOnly(sortedPosts[0]?.dateModified || sortedPosts[0]?.datePublished || new Date().toISOString()) || new Date().toISOString().slice(0, 10);
  const homeLastMod = listingLastMod;

  const sitemapEntries = [
    { loc: `${SITE_URL}/`, lastmod: homeLastMod },
    { loc: `${SITE_URL}/dev-daily.html`, lastmod: listingLastMod },
    ...sortedPosts.map((post) => ({
      loc: `${SITE_URL}/posts/${post.slug}.html`,
      lastmod: toDateOnly(post.dateModified) || toDateOnly(post.datePublished) || listingLastMod
    }))
  ];

  const sitemapXml = renderSitemap(sitemapEntries);
  await fs.writeFile(SITEMAP_PATH, sitemapXml, 'utf8');
  await fs.writeFile(SITEMAP_DUP_PATH, sitemapXml, 'utf8');

  const rssXml = renderRssFeed(sortedPosts);
  await fs.writeFile(RSS_PATH, rssXml, 'utf8');

  console.log(`Generated ${sortedPosts.length} post page(s), updated dev-daily.html, and refreshed sitemap + RSS files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
