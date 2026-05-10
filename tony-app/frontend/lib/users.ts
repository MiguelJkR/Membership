/**
 * Multi-user accounts with roles for Tony AI.
 *
 * Roles:
 *   - admin   → todo (Miguel)
 *   - trader  → trading + analytics + agents (read+execute) sin settings/security
 *   - viewer  → solo read (dashboard, news, research, public-style)
 *
 * Cada user se define como TONY_USER_<N>_USERNAME / _PASSWORD / _ROLE / _NAME en .env.local.
 * Default: TONY_USERNAME / TONY_PASSWORD = admin (Miguel) — backwards compatible.
 *
 * Hasta 5 users adicionales (suficiente para equipo pequeño).
 */

export type UserRole = "admin" | "trader" | "viewer";

export type UserConfig = {
  id: string;
  username: string;
  password: string;  // never sent to client; only used in NextAuth authorize
  name: string;
  email: string;
  role: UserRole;
};

export const ROLE_PERMISSIONS: Record<UserRole, {
  paths_allowed: string[];   // path prefixes user can access
  paths_blocked: string[];   // explicit blocks
  can_execute_orders: boolean;
  can_modify_settings: boolean;
}> = {
  admin: {
    paths_allowed: ["*"],
    paths_blocked: [],
    can_execute_orders: true,
    can_modify_settings: true,
  },
  trader: {
    paths_allowed: ["/", "/trading", "/analytics", "/agents", "/news", "/research", "/chat"],
    paths_blocked: ["/settings", "/security", "/vault"],
    can_execute_orders: true,
    can_modify_settings: false,
  },
  viewer: {
    paths_allowed: ["/", "/trading", "/analytics", "/news", "/research"],
    paths_blocked: ["/settings", "/security", "/vault", "/agents", "/automation", "/email", "/social-manager", "/social"],
    can_execute_orders: false,
    can_modify_settings: false,
  },
};


/** Load users from env vars. Format:
 *   TONY_USERNAME            → admin (legacy, backwards-compat)
 *   TONY_PASSWORD
 *   TONY_USER_2_USERNAME     → second user
 *   TONY_USER_2_PASSWORD
 *   TONY_USER_2_NAME
 *   TONY_USER_2_ROLE         (admin | trader | viewer)
 *   ...up to TONY_USER_5
 */
export function loadUsers(): UserConfig[] {
  const users: UserConfig[] = [];

  // Legacy primary user (always admin)
  const primaryUser = process.env.TONY_USERNAME;
  const primaryPass = process.env.TONY_PASSWORD;
  if (primaryUser && primaryPass) {
    users.push({
      id: "user_1",
      username: primaryUser,
      password: primaryPass,
      name: process.env.TONY_USER_1_NAME || "Miguel A Balart Batlle",
      email: process.env.TONY_USER_1_EMAIL || "contact@maclorianxgroup.com",
      role: (process.env.TONY_USER_1_ROLE as UserRole) || "admin",
    });
  }

  // Additional users 2..5
  for (let i = 2; i <= 5; i++) {
    const u = process.env[`TONY_USER_${i}_USERNAME`];
    const p = process.env[`TONY_USER_${i}_PASSWORD`];
    if (!u || !p) continue;
    const role = (process.env[`TONY_USER_${i}_ROLE`] as UserRole) || "viewer";
    users.push({
      id: `user_${i}`,
      username: u,
      password: p,
      name: process.env[`TONY_USER_${i}_NAME`] || u,
      email: process.env[`TONY_USER_${i}_EMAIL`] || `${u}@maclorianxgroup.com`,
      role,
    });
  }

  return users;
}


/** Authenticate against the configured users. Returns user (without password) or null. */
export function authenticate(username: string, password: string): Omit<UserConfig, "password"> | null {
  const users = loadUsers();
  const found = users.find(u => u.username === username && u.password === password);
  if (!found) return null;
  // Strip password before returning
  const { password: _, ...rest } = found;
  return rest;
}


/** Check if a path is allowed for a role. */
export function pathAllowed(role: UserRole, path: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  // Blocked first
  for (const blocked of perms.paths_blocked) {
    if (path === blocked || path.startsWith(blocked + "/")) return false;
  }
  // Then allowed
  if (perms.paths_allowed.includes("*")) return true;
  for (const allowed of perms.paths_allowed) {
    if (path === allowed || path.startsWith(allowed + "/")) return true;
  }
  return false;
}
