import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import type { UserProfile } from '../types';

describe('useAuthStore', () => {
  const mockUser: UserProfile = {
    id: 'usr-123',
    email: 'test.teacher@yopmail.com',
    role: 'TEACHER',
    is_active: true,
    tenant_id: 'ten-456',
    tenant_slug: 'vjti-mumbai',
    tenant_name: 'VJTI Mumbai',
    student_profile: null,
    teacher_profile: {
      id: 'prof-1',
      employee_id: 'EMP001',
      first_name: 'Test',
      last_name: 'Teacher',
      department: 'Computer Engineering',
      designation: 'Professor',
    },
  };

  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should transition to authenticated on login', () => {
    useAuthStore.getState().login('jwt-mock-token-xyz', mockUser);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('jwt-mock-token-xyz');
    expect(state.user?.email).toBe('test.teacher@yopmail.com');
    expect(state.tenantId).toBe('ten-456');
  });

  it('should reset state on logout', () => {
    useAuthStore.getState().login('jwt-mock-token-xyz', mockUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should manage suspension status correctly', () => {
    useAuthStore.getState().setSuspended(true, 'Payment overdue');
    const state = useAuthStore.getState();
    expect(state.isSuspended).toBe(true);
    expect(state.suspensionReason).toBe('Payment overdue');
  });
});
