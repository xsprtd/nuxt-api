import { describe, it, expect } from 'vitest';
import extractNestedValue from '../../../src/runtime/helpers/extractNestedValue';

describe('extractNestedValue', () => {
  describe('with null or empty key', () => {
    it('returns the full response when key is null', () => {
      const response = { user: { name: 'John' } };
      const result = extractNestedValue(response, null);

      expect(result).toEqual(response);
    });

    it('returns the full response when key is empty string', () => {
      const response = { user: { name: 'John' } };
      const result = extractNestedValue(response, '');

      expect(result).toEqual(response);
    });
  });

  describe('with simple key', () => {
    it('extracts value with a single key', () => {
      const response = { user: { name: 'John', email: 'john@example.com' } };
      const result = extractNestedValue(response, 'user');

      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('returns undefined for missing key', () => {
      const response = { user: { name: 'John' } };
      const result = extractNestedValue(response, 'data');

      expect(result).toBeUndefined();
    });
  });

  describe('with nested key (dot notation)', () => {
    it('extracts value with two-level nested key', () => {
      const response = { data: { user: { name: 'John' } } };
      const result = extractNestedValue(response, 'data.user');

      expect(result).toEqual({ name: 'John' });
    });

    it('extracts value with deeply nested key', () => {
      const response = {
        data: {
          attributes: {
            user: {
              profile: { name: 'John' },
            },
          },
        },
      };
      const result = extractNestedValue(response, 'data.attributes.user.profile');

      expect(result).toEqual({ name: 'John' });
    });

    it('returns undefined when intermediate key is missing', () => {
      const response = { data: { user: { name: 'John' } } };
      const result = extractNestedValue(response, 'data.attributes.user');

      expect(result).toBeUndefined();
    });
  });

  describe('with null or undefined response', () => {
    it('handles null response', () => {
      const result = extractNestedValue(null, 'user');

      expect(result).toBeNull();
    });

    it('handles undefined response', () => {
      const result = extractNestedValue(undefined, 'user');

      expect(result).toBeUndefined();
    });
  });

  describe('type inference', () => {
    it('returns typed result', () => {
      interface User {
        name: string;
        email: string;
      }
      const response = { user: { name: 'John', email: 'john@example.com' } };
      const result = extractNestedValue<User>(response, 'user');

      expect(result?.name).toBe('John');
      expect(result?.email).toBe('john@example.com');
    });
  });
});
