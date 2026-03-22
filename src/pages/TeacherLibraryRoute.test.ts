import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: teacher-layout-alignment
// Task 2.1: Unit tests for /teacher/library route
// Validates: Requirements 3.1, 3.4
// ─────────────────────────────────────────────────────────────────────────────

const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8');

describe('/teacher/library route – existence and protection (Requirement 3.1)', () => {
  it('App.tsx registers a route at /teacher/library', () => {
    expect(appSource).toContain('path="/teacher/library"');
  });

  it('/teacher/library route is wrapped in ProtectedRoute', () => {
    // Find the /teacher/library route block and confirm ProtectedRoute wraps it
    const routeIndex = appSource.indexOf('path="/teacher/library"');
    expect(routeIndex).toBeGreaterThan(-1);

    // The ProtectedRoute open tag must appear before the closing Route tag
    const routeBlock = appSource.slice(routeIndex, routeIndex + 300);
    expect(routeBlock).toContain('ProtectedRoute');
  });

  it('/teacher/library route renders the Library component', () => {
    const routeIndex = appSource.indexOf('path="/teacher/library"');
    const routeBlock = appSource.slice(routeIndex, routeIndex + 300);
    expect(routeBlock).toContain('<Library');
  });
});

describe('/teacher/library navbar hiding (Requirement 3.3)', () => {
  it('hideNavbar logic covers /teacher/library via startsWith("/teacher")', () => {
    // The hideNavbar expression must use startsWith('/teacher') so that
    // /teacher/library is automatically covered without a special case.
    expect(appSource).toContain("startsWith('/teacher')");

    // Verify the logic: /teacher/library starts with /teacher
    const path = '/teacher/library';
    expect(path.startsWith('/teacher')).toBe(true);
  });
});

describe('ProtectedRoute redirect behaviour (Requirement 3.4)', () => {
  it('ProtectedRoute redirects to /auth when user is null', () => {
    // Read ProtectedRoute source and confirm the redirect target
    const protectedRouteSource = readFileSync(
      resolve(__dirname, '../components/ProtectedRoute.tsx'),
      'utf-8'
    );
    expect(protectedRouteSource).toContain('Navigate');
    expect(protectedRouteSource).toContain('to="/auth"');
  });

  it('ProtectedRoute renders children when user is present', () => {
    // Confirm the component returns children (not a redirect) for authenticated users
    const protectedRouteSource = readFileSync(
      resolve(__dirname, '../components/ProtectedRoute.tsx'),
      'utf-8'
    );
    // The component must return children when user is truthy
    expect(protectedRouteSource).toContain('return <>{children}</>');
  });

  it('ProtectedRoute shows a loading state while auth is resolving', () => {
    const protectedRouteSource = readFileSync(
      resolve(__dirname, '../components/ProtectedRoute.tsx'),
      'utf-8'
    );
    expect(protectedRouteSource).toContain('loading');
  });
});
