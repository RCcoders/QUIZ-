/**
 * Unit tests for Schema.org markup in LandingPage.tsx
 *
 * Validates: Requirements 8.2, 8.3, 8.4
 *
 * Reads LandingPage.tsx as source text and asserts the required
 * JSON-LD fields are present in the source.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, 'LandingPage.tsx'), 'utf-8');

describe('LandingPage Schema.org — WebApplication JSON-LD (Requirement 8.2)', () => {
  it('contains featureList field', () => {
    expect(source).toContain('featureList');
  });

  it('featureList includes AI quiz generation', () => {
    expect(source).toContain('AI quiz generation');
  });

  it('featureList includes Real-time leaderboard', () => {
    expect(source).toContain('Real-time leaderboard');
  });

  it('featureList includes Student analytics', () => {
    expect(source).toContain('Student analytics');
  });

  it('featureList includes Live quiz sessions', () => {
    expect(source).toContain('Live quiz sessions');
  });

  it('contains screenshot field pointing to quizmaster.app', () => {
    expect(source).toContain('screenshot');
    expect(source).toContain('https://quizmaster.app/screenshot.png');
  });

  it('contains author field with Organization type', () => {
    expect(source).toContain('author');
    expect(source).toContain("'@type': 'Organization'");
  });
});

describe('LandingPage Schema.org — FAQPage JSON-LD (Requirement 8.3)', () => {
  it('contains FAQPage @type', () => {
    expect(source).toContain("'@type': 'FAQPage'");
  });

  it('contains mainEntity array', () => {
    expect(source).toContain('mainEntity');
  });

  it('has at least 3 Question entries', () => {
    const matches = source.match(/'@type': 'Question'/g);
    expect(matches).not.toBeNull();
    expect((matches as RegExpMatchArray).length).toBeGreaterThanOrEqual(3);
  });

  it('each question has an acceptedAnswer', () => {
    const matches = source.match(/'@type': 'Answer'/g);
    expect(matches).not.toBeNull();
    expect((matches as RegExpMatchArray).length).toBeGreaterThanOrEqual(3);
  });

  it('covers AI quiz creation question', () => {
    expect(source).toContain('How do I create a quiz with AI?');
  });

  it('covers free tier question', () => {
    expect(source).toContain('Is QuizMaster free to use?');
  });

  it('covers how students join question', () => {
    expect(source).toContain('How do students join a live quiz?');
  });
});

describe('LandingPage Schema.org — BreadcrumbList JSON-LD (Requirement 8.4)', () => {
  it('contains BreadcrumbList @type', () => {
    expect(source).toContain("'@type': 'BreadcrumbList'");
  });

  it('contains itemListElement array', () => {
    expect(source).toContain('itemListElement');
  });

  it('has at least 1 ListItem entry', () => {
    const matches = source.match(/'@type': 'ListItem'/g);
    expect(matches).not.toBeNull();
    expect((matches as RegExpMatchArray).length).toBeGreaterThanOrEqual(1);
  });

  it('home breadcrumb points to quizmaster.app', () => {
    expect(source).toContain('https://quizmaster.app/');
  });
});

describe('LandingPage Schema.org — script tags rendered (Requirements 8.3, 8.4)', () => {
  it('renders FAQPage JSON-LD via dangerouslySetInnerHTML', () => {
    expect(source).toContain('jsonLdFaq');
    expect(source).toContain('JSON.stringify(jsonLdFaq)');
  });

  it('renders BreadcrumbList JSON-LD via dangerouslySetInnerHTML', () => {
    expect(source).toContain('jsonLdBreadcrumb');
    expect(source).toContain('JSON.stringify(jsonLdBreadcrumb)');
  });
});
