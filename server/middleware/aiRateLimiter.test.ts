import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { aiRateLimiter, clearRateLimiterCache } from './aiRateLimiter.js';

describe('aiRateLimiter', () => {
  beforeEach(() => {
    clearRateLimiterCache();
  });

  const mockReq = (userId: string) => ({ user: { _id: userId } } as any);
  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };
  const mockNext = () => vi.fn();

  it('allows 5 requests and blocks the 6th', () => {
    const req = mockReq('user1');
    const res = mockRes();
    const next = mockNext();

    for (let i = 0; i < 5; i++) {
      aiRateLimiter(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).not.toHaveBeenCalled();

    aiRateLimiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ message: 'Rate limit exceeded. Maximum 5 AI requests per minute.' });
  });

  it('Property 10: Rate limiter enforces 5 requests per user per minute isolation', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }),
        (userIds: string[]) => {
          clearRateLimiterCache();

          for (const uid of userIds) {
            const req = mockReq(uid);
            const res = mockRes();
            const next = mockNext();

            for (let i = 0; i < 5; i++) {
              aiRateLimiter(req, res, next);
            }
            expect(next).toHaveBeenCalledTimes(5);
            expect(res.status).not.toHaveBeenCalled();

            const next6 = mockNext();
            aiRateLimiter(req, res, next6);
            expect(next6).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(429);
          }
        }
      )
    );
  });
});
