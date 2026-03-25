/**
 * Property-based tests for sitemap completeness.
 *
 * Property 5: Sitemap contains all required URLs
 * Validates: Requirements 7.2, 7.3, 7.4
 *
 * Reads public/sitemap.xml as a string and uses fast-check to verify:
 * - For any required path, the sitemap contains a <loc> with the fully qualified URL
 * - Each <url> block contains a <lastmod> element
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://quizmaster.app';

const REQUIRED_PATHS = ['/', '/login', '/signup', '/student', '/join', '/library', '/privacy', '/terms'] as const;

// Read the sitemap once at module load time
const sitemapPath = resolve(__dirname, '../../public/sitemap.xml');
const sitemapContent = readFileSync(sitemapPath, 'utf-8');

/**
 * Extract all <url>...</url> blocks from the sitemap string.
 */
function extractUrlBlocks(xml: string): string[] {
  const blocks: string[] = [];
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(xml)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

/**
 * Build the fully qualified URL for a given path.
 * The root path "/" maps to "https://quizmaster.app/" and all others
 * map to "https://quizmaster.app{path}" (no trailing slash).
 */
function fullyQualifiedUrl(path: string): string {
  if (path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path}`;
}

describe('sitemap.xml — Property 5: Sitemap contains all required URLs', () => {
  // Unit assertions: concrete examples for each required path
  it('sitemap contains a <loc> for the root URL', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/</loc>`);
  });

  it('sitemap contains a <loc> for /login', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/login</loc>`);
  });

  it('sitemap contains a <loc> for /signup', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/signup</loc>`);
  });

  it('sitemap contains a <loc> for /student', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/student</loc>`);
  });

  it('sitemap contains a <loc> for /join', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/join</loc>`);
  });

  it('sitemap contains a <loc> for /privacy', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/privacy</loc>`);
  });

  it('sitemap contains a <loc> for /terms', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/terms</loc>`);
  });

  it('sitemap contains a <loc> for /library', () => {
    expect(sitemapContent).toContain(`<loc>${BASE_URL}/library</loc>`);
  });

  it('sitemap contains exactly 8 <url> blocks', () => {
    const blocks = extractUrlBlocks(sitemapContent);
    expect(blocks).toHaveLength(8);
  });

  it('every <url> block contains a <lastmod> element', () => {
    const blocks = extractUrlBlocks(sitemapContent);
    for (const block of blocks) {
      expect(block).toContain('<lastmod>');
    }
  });

  /**
   * Property 5: For any required public route path, the sitemap contains a <loc>
   * element whose value is the fully qualified URL for that path.
   *
   * Validates: Requirements 7.2, 7.3
   */
  it('Property 5: for any required path, the sitemap contains a fully qualified <loc>', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_PATHS),
        (path) => {
          const expectedLoc = `<loc>${fullyQualifiedUrl(path)}</loc>`;
          return sitemapContent.includes(expectedLoc);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5 (lastmod): For any required path, the <url> block that contains
   * its <loc> also contains a <lastmod> element.
   *
   * Validates: Requirements 7.4
   */
  it('Property 5 (lastmod): for any required path, its <url> block contains a <lastmod> element', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_PATHS),
        (path) => {
          const expectedLoc = fullyQualifiedUrl(path);
          const blocks = extractUrlBlocks(sitemapContent);
          const matchingBlock = blocks.find((block) => block.includes(`<loc>${expectedLoc}</loc>`));
          if (!matchingBlock) return false;
          return matchingBlock.includes('<lastmod>');
        }
      ),
      { numRuns: 100 }
    );
  });
});
