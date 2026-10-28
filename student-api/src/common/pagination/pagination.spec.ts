import { buildMeta, toSkip } from './pagination';

describe('pagination', () => {
  it('builds meta for a middle page', () => {
    expect(buildMeta(45, 2, 10)).toEqual({ total: 45, currentPage: 2, limit: 10, pages: 5, hasNextPage: true, hasPrevPage: true });
  });
  it('first and last page flags', () => {
    expect(buildMeta(45, 1, 10).hasPrevPage).toBe(false);
    expect(buildMeta(45, 5, 10).hasNextPage).toBe(false);
  });
  it('empty result has no next page', () => {
    expect(buildMeta(0, 1, 10)).toMatchObject({ total: 0, pages: 0, hasNextPage: false, hasPrevPage: false });
  });
  it('computes skip', () => {
    expect(toSkip(3, 20)).toBe(40);
  });
});
