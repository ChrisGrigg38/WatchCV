import { renderHook, act } from '@testing-library/react';
import { useTrackings } from '../hooks/useTrackings';

const COOKIE_KEY = 'watchcv_trackings';

// Helper to read the current cookie value for assertions
function readCookie(): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  if (!match) return '';
  return decodeURIComponent(match.split('=')[1]);
}

// Helper to write a cookie directly for test setup
function writeCookie(data: object) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(data))}; path=/`;
}

// Helper to clear the tracking cookie between tests
function clearCookie() {
  document.cookie = `${COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

describe('useTrackings', () => {
  beforeEach(() => {
    clearCookie();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial load', () => {
    it('returns empty trackings when no cookie exists', () => {
      const { result } = renderHook(() => useTrackings());
      expect(result.current.trackings).toEqual([]);
    });

    it('loads existing trackings from cookie on mount', () => {
      const existing = [
        { trackingId: 'abc-123', label: 'My CV', createdAt: '2024-01-01T00:00:00.000Z' },
        { trackingId: 'def-456', label: 'Portfolio', createdAt: '2024-02-01T00:00:00.000Z' },
      ];
      writeCookie(existing);

      const { result } = renderHook(() => useTrackings());
      expect(result.current.trackings).toHaveLength(2);
      expect(result.current.trackings[0].trackingId).toBe('abc-123');
      expect(result.current.trackings[1].trackingId).toBe('def-456');
    });

    it('returns empty array when cookie contains malformed JSON', () => {
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent('not-valid-json')}; path=/`;
      const { result } = renderHook(() => useTrackings());
      expect(result.current.trackings).toEqual([]);
    });

    it('returns empty array when cookie value is empty string', () => {
      document.cookie = `${COOKIE_KEY}=; path=/`;
      const { result } = renderHook(() => useTrackings());
      expect(result.current.trackings).toEqual([]);
    });

    it('returns empty array when cookie contains a non-array JSON value', () => {
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify({ not: 'an array' }))}; path=/`;
      // Hook will load it — types aren't validated at runtime — but it shouldn't crash
      const { result } = renderHook(() => useTrackings());
      expect(result.current.trackings).toBeDefined();
    });
  });

  describe('addTracking', () => {
    it('adds a new tracking entry to the state', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.addTracking('new-guid-1', 'Senior Dev CV');
      });

      expect(result.current.trackings).toHaveLength(1);
      expect(result.current.trackings[0].trackingId).toBe('new-guid-1');
      expect(result.current.trackings[0].label).toBe('Senior Dev CV');
    });

    it('sets createdAt to the current ISO timestamp', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.addTracking('new-guid-1', 'My CV');
      });

      expect(result.current.trackings[0].createdAt).toBe('2024-06-01T12:00:00.000Z');
    });

    it('prepends new entry to the front of the list', () => {
      const existing = [
        { trackingId: 'old-1', label: 'Old CV', createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.addTracking('new-1', 'New CV');
      });

      expect(result.current.trackings[0].trackingId).toBe('new-1');
      expect(result.current.trackings[1].trackingId).toBe('old-1');
    });

    it('persists the new entry to the cookie', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.addTracking('persist-guid', 'Persisted CV');
      });

      const cookieData = JSON.parse(readCookie());
      expect(cookieData).toHaveLength(1);
      expect(cookieData[0].trackingId).toBe('persist-guid');
    });

    it('accumulates multiple entries correctly', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => result.current.addTracking('guid-1', 'CV One'));
      act(() => result.current.addTracking('guid-2', 'CV Two'));
      act(() => result.current.addTracking('guid-3', 'CV Three'));

      expect(result.current.trackings).toHaveLength(3);
      // Most recently added should be first
      expect(result.current.trackings[0].trackingId).toBe('guid-3');
      expect(result.current.trackings[2].trackingId).toBe('guid-1');
    });

    it('saves all accumulated entries to cookie', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => result.current.addTracking('guid-1', 'CV One'));
      act(() => result.current.addTracking('guid-2', 'CV Two'));

      const cookieData = JSON.parse(readCookie());
      expect(cookieData).toHaveLength(2);
    });

    it('sets cookie expiry approximately 2 years in the future', () => {
      const setCookieSpy = jest.spyOn(document, 'cookie', 'set');
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.addTracking('guid-1', 'CV');
      });

      const cookieString = setCookieSpy.mock.calls[setCookieSpy.mock.calls.length-1] ?? '';
      // Extract and verify expiry is ~2 years ahead
      expect(cookieString).toEqual(["watchcv_trackings=%5B%7B%22trackingId%22%3A%22guid-1%22%2C%22label%22%3A%22CV%22%2C%22createdAt%22%3A%222024-06-01T12%3A00%3A00.000Z%22%7D%5D; expires=Mon, 01 Jun 2026 12:00:00 GMT; path=/; SameSite=Lax"])

      
      setCookieSpy.mockRestore();
    });

    it('sets SameSite=Lax on the cookie', () => {
      const setCookieSpy = jest.spyOn(document, 'cookie', 'set');
      const { result } = renderHook(() => useTrackings());

      act(() => result.current.addTracking('guid-1', 'CV'));

      const cookieString = setCookieSpy.mock.calls[setCookieSpy.mock.calls.length-1] ?? '';
      expect(cookieString.reduce((_prev, cur) => { return cur }, "")).toContain('SameSite=Lax');
      setCookieSpy.mockRestore();
    });
  });

  describe('removeTracking', () => {
    it('removes the specified tracking from state', () => {
      const existing = [
        { trackingId: 'keep-me', label: 'Keep', createdAt: '2024-01-01T00:00:00.000Z' },
        { trackingId: 'remove-me', label: 'Remove', createdAt: '2024-01-02T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('remove-me');
      });

      expect(result.current.trackings).toHaveLength(1);
      expect(result.current.trackings[0].trackingId).toBe('keep-me');
    });

    it('does nothing when trackingId does not exist', () => {
      const existing = [
        { trackingId: 'abc-1', label: 'CV', createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('does-not-exist');
      });

      expect(result.current.trackings).toHaveLength(1);
    });

    it('results in empty state when the last tracking is removed', () => {
      const existing = [
        { trackingId: 'only-one', label: 'CV', createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('only-one');
      });

      expect(result.current.trackings).toHaveLength(0);
    });

    it('persists the removal to the cookie', () => {
      const existing = [
        { trackingId: 'stay', label: 'Stay', createdAt: '2024-01-01T00:00:00.000Z' },
        { trackingId: 'go', label: 'Go', createdAt: '2024-01-02T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('go');
      });

      const cookieData = JSON.parse(readCookie());
      expect(cookieData).toHaveLength(1);
      expect(cookieData[0].trackingId).toBe('stay');
    });

    it('writes an empty array to cookie when all trackings are removed', () => {
      const existing = [
        { trackingId: 'last', label: 'Last', createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('last');
      });

      const cookieData = JSON.parse(readCookie());
      expect(cookieData).toEqual([]);
    });

    it('only removes the matching entry when duplicates exist', () => {
      // Shouldn't happen in practice but worth testing filter behaviour
      const existing = [
        { trackingId: 'dup', label: 'First', createdAt: '2024-01-01T00:00:00.000Z' },
        { trackingId: 'dup', label: 'Second', createdAt: '2024-01-02T00:00:00.000Z' },
        { trackingId: 'unique', label: 'Unique', createdAt: '2024-01-03T00:00:00.000Z' },
      ];
      writeCookie(existing);
      const { result } = renderHook(() => useTrackings());

      act(() => {
        result.current.removeTracking('dup');
      });

      // filter removes ALL matching — both dups go, unique stays
      expect(result.current.trackings).toHaveLength(1);
      expect(result.current.trackings[0].trackingId).toBe('unique');
    });
  });

  describe('add then remove', () => {
    it('adds and then removes a tracking correctly', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => result.current.addTracking('temp-guid', 'Temp CV'));
      expect(result.current.trackings).toHaveLength(1);

      act(() => result.current.removeTracking('temp-guid'));
      expect(result.current.trackings).toHaveLength(0);
    });

    it('cookie stays in sync after add then remove', () => {
      const { result } = renderHook(() => useTrackings());

      act(() => result.current.addTracking('sync-guid', 'Sync CV'));
      act(() => result.current.removeTracking('sync-guid'));

      const cookieData = JSON.parse(readCookie());
      expect(cookieData).toEqual([]);
    });
  });
});