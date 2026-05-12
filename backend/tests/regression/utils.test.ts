import { describe, it, expect } from 'vitest';
import { levenshteinDistance } from '../../src/utils.js';

describe('Levenshtein Distance Regression Tests', () => {
    it('should return 0 for identical strings', () => {
        expect(levenshteinDistance('apple', 'apple')).toBe(0);
    });

    it('should return 1 for one character difference (substitution)', () => {
        expect(levenshteinDistance('apple', 'apple')).toBe(0);
        expect(levenshteinDistance('apple', 'apply')).toBe(1);
    });

    it('should return 1 for one character difference (addition)', () => {
        expect(levenshteinDistance('apple', 'apples')).toBe(1);
    });

    it('should return 1 for one character difference (deletion)', () => {
        expect(levenshteinDistance('apple', 'appl')).toBe(1);
    });

    it('should be case sensitive (as per current implementation)', () => {
        // The current implementation compares s[j - 1] === t[i - 1] directly
        expect(levenshteinDistance('Apple', 'apple')).toBe(1);
    });

    it('should handle empty strings', () => {
        expect(levenshteinDistance('', 'abc')).toBe(3);
        expect(levenshteinDistance('abc', '')).toBe(3);
        expect(levenshteinDistance('', '')).toBe(0);
    });
});
