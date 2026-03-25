/**
 * Unit tests for robots.txt
 *
 * Validates: Requirements 7.5
 *
 * Reads public/robots.txt and asserts it contains the required directives,
 * including the Sitemap directive pointing to the production URL.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const robotsPath = resolve(__dirname, '../../public/robots.txt');
const robotsContent = readFileSync(robotsPath, 'utf-8');

describe('robots.txt', () => {
  it('contains the Sitemap directive pointing to the production URL', () => {
    expect(robotsContent).toContain('Sitemap: https://quizmaster.app/sitemap.xml');
  });

  it('contains User-agent: *', () => {
    expect(robotsContent).toContain('User-agent: *');
  });

  it('contains Allow: /', () => {
    expect(robotsContent).toContain('Allow: /');
  });
});
