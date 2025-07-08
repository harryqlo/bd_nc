import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

describe('AuthProvider integration', () => {
  it('stores user in localStorage on login', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    act(() => {
      result.current.login('admin', UserRole.ADMIN);
    });
    const stored = localStorage.getItem('authUser');
    expect(stored).toContain('admin');
  });
});
