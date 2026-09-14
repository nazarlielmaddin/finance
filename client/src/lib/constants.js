export const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'cancelled'];
export const BOARD_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done'];
export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export const ROLES = ['super_admin', 'developer', 'tech_support', 'technician', 'moderator', 'department_manager', 'employee'];

export const LOCALES = [
  { code: 'az', label: 'Azərbaycan' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
];

// Asana-style fixed project/label color palette.
export const PALETTE = [
  { key: 'red', hex: '#e8384f' },
  { key: 'orange', hex: '#fd612c' },
  { key: 'amber', hex: '#f1bd6c' },
  { key: 'yellow', hex: '#fbe26c' },
  { key: 'lime', hex: '#a4cf30' },
  { key: 'green', hex: '#62d26f' },
  { key: 'teal', hex: '#37c5ab' },
  { key: 'aqua', hex: '#20aaea' },
  { key: 'blue', hex: '#4186e0' },
  { key: 'indigo', hex: '#7a6ff0' },
  { key: 'purple', hex: '#aa62e3' },
  { key: 'magenta', hex: '#e362e3' },
  { key: 'pink', hex: '#ef67c2' },
  { key: 'hotpink', hex: '#fc979a' },
  { key: 'gray', hex: '#8da3a6' },
];
export const colorHex = (key) => PALETTE.find((c) => c.key === key)?.hex || key || '#8da3a6';

// Project view tabs (Asana multi-view).
export const PROJECT_VIEWS = ['overview', 'list', 'board', 'timeline', 'calendar', 'dashboard'];
export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const FULL_ACCESS_ROLES = ['super_admin', 'developer'];
export const isFullAccess = (role) => FULL_ACCESS_ROLES.includes(role);
// Gated Finance section: full-access roles always, plus anyone explicitly granted.
export const hasFinanceAccess = (user) => !!user && (user.role === 'developer' || !!user.finance_access);
export const hasIpAccess = (user) => !!user && (isFullAccess(user.role) || !!user.ip_access);
export const isManagerRole = (role) => role === 'department_manager';
export const isModeratorRole = (role) => role === 'moderator';
export const canManage = (role) => isFullAccess(role) || isManagerRole(role) || isModeratorRole(role);
// Read-only staff surfaces (people directory, departments): admins + moderators.
export const isStaffViewer = (role) => isFullAccess(role) || isModeratorRole(role);
export const isAdminRole = (role) => isFullAccess(role);
