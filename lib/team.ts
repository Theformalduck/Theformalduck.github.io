import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, ASSIGNABLE_ROLES, ACCOUNT_COOKIE, type Role, type Permission } from "@/lib/team-roles";

export * from "@/lib/team-roles";

export interface ActiveAccount {
  ownerId: string;       // the account being operated on
  role: Role;
  permissions: Permission[];
  isStaff: boolean;      // true when acting on someone else's account
}

// Resolve which account the user is currently operating (their own by default,
// or an account they're an active staff member of, selected via cookie).
export async function getActiveAccount(userId: string): Promise<ActiveAccount> {
  const selfAccount: ActiveAccount = { ownerId: userId, role: "OWNER", permissions: ALL_PERMISSIONS, isStaff: false };
  let acct: string | undefined;
  try {
    acct = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  } catch { /* not in a request scope */ }
  if (!acct || acct === userId) return selfAccount;

  const member = await db.teamMember.findFirst({
    where: { ownerId: acct, userId, status: "active" },
  }).catch(() => null);
  if (!member) return selfAccount;

  const role = (ASSIGNABLE_ROLES.includes(member.role as Role) ? member.role : "STAFF") as Role;
  return { ownerId: acct, role, permissions: ROLE_PERMISSIONS[role] ?? [], isStaff: true };
}

export function can(account: ActiveAccount, perm: Permission): boolean {
  return account.permissions.includes(perm);
}

// All accounts the user can operate: their own plus active staff memberships.
export async function listAccounts(userId: string): Promise<{ ownerId: string; name: string; role: Role; isSelf: boolean }[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId, status: "active" },
    select: { ownerId: true, role: true, owner: { select: { name: true, username: true } } },
  }).catch(() => []);
  const self = await db.user.findUnique({ where: { id: userId }, select: { name: true, username: true } });
  return [
    { ownerId: userId, name: self?.name ?? self?.username ?? "My account", role: "OWNER" as Role, isSelf: true },
    ...memberships.map((m) => ({
      ownerId: m.ownerId,
      name: m.owner?.name ?? m.owner?.username ?? "Account",
      role: (ASSIGNABLE_ROLES.includes(m.role as Role) ? m.role : "STAFF") as Role,
      isSelf: false,
    })),
  ];
}
