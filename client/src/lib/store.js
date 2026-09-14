import { create } from 'zustand';
export const useAuth = create(() => ({ user: { id: 1, full_name: 'Demo istifadəçi', role: 'developer', finance_access: 1 } }));
