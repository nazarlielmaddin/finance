import { get, all } from '../db/db.js';

// Role model: super_admin & developer = full access; department_manager = own department;
// employee = own tasks within own department (read department, write own).
export const FULL_ACCESS = ['super_admin', 'developer'];

export const isFullAccess = (user) => FULL_ACCESS.includes(user?.role);
export const isManager = (user) => user?.role === 'department_manager';
// Moderators act like admins on content (see everything, assign anywhere) but
// never gain the admin-only surfaces (user management, access matrix, audit).
export const isModerator = (user) => user?.role === 'moderator';
export const isEmployee = (user) => user?.role === 'employee';

// Require one of the given roles (full-access roles always pass).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (isFullAccess(req.user) || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'forbidden' });
  };
}

// Admin-only surfaces (departments, users, roles, audit, news authoring).
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (isFullAccess(req.user)) return next();
  return res.status(403).json({ error: 'forbidden' });
}

// Managers and admins (task creation, resource planning, reports).
export function requireManager(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (isFullAccess(req.user) || isManager(req.user) || isModerator(req.user)) return next();
  return res.status(403).json({ error: 'forbidden' });
}

// Can this user see items belonging to a department?
export function canViewDepartment(user, departmentId) {
  if (isFullAccess(user) || isModerator(user)) return true;
  return user.department_id != null && user.department_id === departmentId;
}

// Can this user create/assign tasks in a department?
export function canManageDepartment(user, departmentId) {
  if (isFullAccess(user) || isModerator(user)) return true;
  if (departmentId == null) return false;
  if (isManager(user) && user.department_id === departmentId) return true;
  // listed as one of the department's managers (many-to-many)
  return !!get('SELECT 1 AS x FROM department_managers WHERE department_id = ? AND user_id = ?', departmentId, user.id);
}

// Can this user edit a specific task?
export function canEditTask(user, task) {
  if (isFullAccess(user) || isModerator(user)) return true;
  if (isManager(user)) return task.department_id === user.department_id;
  // Project moderators / admins (or members granted edit/close permission) may edit tasks in the project.
  if (task.project_id) {
    const m = get('SELECT project_role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', task.project_id, user.id);
    if (m) {
      if (m.project_role === 'moderator' || m.project_role === 'admin') return true;
      try { const p = JSON.parse(m.permissions || '{}'); if (p.edit || p.close) return true; } catch { /* ignore */ }
    }
  }
  // employees may edit tasks they are assigned to (status/progress/comments/checklist/time)
  return (
    task.assignee_id === user.id ||
    task.secondary_assignee_id === user.id ||
    task.reporter_id === user.id
  );
}

// Who may delete a task: admins, the dept manager, the reporter, or a project
// moderator/admin / member granted the "delete" permission.
export function canDeleteTask(user, task) {
  if (isFullAccess(user)) return true;
  if (isManager(user) && task.department_id === user.department_id) return true;
  if (task.reporter_id === user.id) return true;
  if (task.project_id) {
    const m = get('SELECT project_role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', task.project_id, user.id);
    if (m) {
      if (m.project_role === 'moderator' || m.project_role === 'admin') return true;
      try { if (JSON.parse(m.permissions || '{}').delete) return true; } catch { /* ignore */ }
    }
  }
  return false;
}

// Can this user create tasks inside a given project (project admin/moderator,
// or a member granted the "create" capability)?
export function canCreateTaskInProject(user, projectId) {
  if (!projectId) return false;
  if (isFullAccess(user) || isModerator(user)) return true;
  const m = get('SELECT project_role, permissions FROM project_members WHERE project_id = ? AND user_id = ?', projectId, user.id);
  if (!m) return false;
  if (m.project_role === 'moderator' || m.project_role === 'admin') return true;
  try { return !!JSON.parse(m.permissions || '{}').create; } catch { return false; }
}

// Can this user approve a task (approval workflow)? Admins, the dept head, or the
// project's head (moderator/admin) can finalise a pending close.
export function canApproveTask(user, task) {
  if (isFullAccess(user) || isModerator(user)) return true;
  if (isManager(user) && task.department_id === user.department_id) return true;
  if (task.project_id) {
    const m = get('SELECT project_role FROM project_members WHERE project_id = ? AND user_id = ?', task.project_id, user.id);
    if (m && (m.project_role === 'moderator' || m.project_role === 'admin')) return true;
  }
  return false;
}

// ── Per-task permission flags for the UI ──────────────────────────────────
// The client used to guess who may edit/delete a task from the role alone, which
// hid the buttons from project moderators, members with granted permissions and
// plain assignees (the server would have allowed them). These helpers compute the
// real answer once per request and are attached to every task the API returns.
export function permContext(user) {
  const ctx = { user, full: isFullAccess(user), moderator: isModerator(user), manager: isManager(user), projects: new Map() };
  if (!user || ctx.full || ctx.moderator) return ctx;
  for (const m of allProjectMemberships(user.id)) {
    let p = {};
    try { p = JSON.parse(m.permissions || '{}'); } catch { p = {}; }
    const head = m.project_role === 'moderator' || m.project_role === 'admin';
    ctx.projects.set(m.project_id, { head, edit: head || !!p.edit || !!p.close, del: head || !!p.delete, approve: head });
  }
  return ctx;
}

function allProjectMemberships(userId) {
  return all('SELECT project_id, project_role, permissions FROM project_members WHERE user_id = ?', userId);
}

export function taskPerms(ctx, task) {
  if (!ctx?.user || !task) return { can_edit: false, can_delete: false, can_approve: false };
  const u = ctx.user;
  const pr = task.project_id ? ctx.projects.get(task.project_id) : null;
  const mine = task.assignee_id === u.id || task.secondary_assignee_id === u.id || task.reporter_id === u.id;
  const deptHead = ctx.manager && task.department_id === u.department_id;
  const can_edit = ctx.full || ctx.moderator || deptHead || !!pr?.edit || mine;
  const can_delete = ctx.full || deptHead || task.reporter_id === u.id || !!pr?.del;
  const can_approve = ctx.full || ctx.moderator || deptHead || !!pr?.approve;
  return { can_edit, can_delete, can_approve };
}

// Attach the flags to one task or a list of tasks (single membership lookup).
export function withPerms(tasks, user) {
  const ctx = permContext(user);
  if (Array.isArray(tasks)) return tasks.map((t) => Object.assign(t, taskPerms(ctx, t)));
  return tasks ? Object.assign(tasks, taskPerms(ctx, tasks)) : tasks;
}
