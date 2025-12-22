import { describe, it, expect, beforeEach } from 'vitest';
import { useCurrentUser } from '../../../src/runtime/composables/useCurrentUser';
import { clearStateStore, setRuntimeConfigOptions } from '../../mocks/app';

interface TestUser {
  id: number;
  name: string;
  email: string;
}

describe('useCurrentUser', () => {
  beforeEach(() => {
    clearStateStore();
    setRuntimeConfigOptions({});
  });

  it('returns a ref with initial value of null', () => {
    const user = useCurrentUser();

    expect(user.value).toBeNull();
  });

  it('returns the same state instance when called multiple times', () => {
    const user1 = useCurrentUser();
    const user2 = useCurrentUser();

    user1.value = { id: 1, name: 'John' };

    expect(user2.value).toEqual({ id: 1, name: 'John' });
  });

  it('supports generic typing', () => {
    const user = useCurrentUser<TestUser>();

    user.value = { id: 1, name: 'John', email: 'john@example.com' };

    expect(user.value.id).toBe(1);
    expect(user.value.name).toBe('John');
    expect(user.value.email).toBe('john@example.com');
  });

  it('uses configured userStateKey', () => {
    setRuntimeConfigOptions({ userStateKey: 'currentUser' });

    const user = useCurrentUser();
    user.value = { id: 1 };

    // Getting a new instance should still reference the same state
    const user2 = useCurrentUser();
    expect(user2.value).toEqual({ id: 1 });
  });

  it('can be set to null to clear user', () => {
    const user = useCurrentUser<TestUser>();

    user.value = { id: 1, name: 'John', email: 'john@example.com' };
    expect(user.value).not.toBeNull();

    user.value = null;
    expect(user.value).toBeNull();
  });
});
