import { db } from '@/db';
import { memberships, userRolesEnum, consumerSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Define a type for user roles for better type safety
export type UserRole = typeof userRolesEnum.enumValues[number];

/**
 * Checks if a user has a specific role or higher within an organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @param requiredRole The minimum role required.
 * @returns True if the user meets the role requirement, false otherwise.
 */
export async function checkUserRole(
  userId: string,
  organizationId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const member = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, organizationId)
    ),
  });

  if (!member) {
    return false; // User is not a member of this organization
  }

  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 5,
    admin: 4,
    staff_admin: 3,
    staff_manager: 2,
    consumer: 1,
  };

  const userRoleLevel = roleHierarchy[member.role];
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Checks if a user has at least one of the specified roles within an organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @param requiredRoles An array of roles, the user must have at least one of them.
 * @returns True if the user meets any of the role requirements, false otherwise.
 */
export async function checkUserRoles(
  userId: string,
  organizationId: string,
  requiredRoles: UserRole[]
): Promise<boolean> {
  for (const role of requiredRoles) {
    if (await checkUserRole(userId, organizationId, role)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a user has an active subscription to an organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns True if the user has an active subscription, false otherwise.
 */
export async function checkUserActiveSubscription(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const activeSubscription = await db.query.consumerSubscriptions.findFirst({
    where: and(
      eq(consumerSubscriptions.userId, userId),
      eq(consumerSubscriptions.organizationId, organizationId),
      eq(consumerSubscriptions.status, 'active') // Only 'active' status means subscribed
    ),
  });

  return !!activeSubscription;
}

