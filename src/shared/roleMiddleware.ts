import { Context, HttpRequest } from '@azure/functions';
import { Logger } from './Logger';
import { AuthenticatedUser } from './authMiddleware';
import { ApiResponseBuilder } from './ApiResponse';
import { USER_ROLES } from './UserRoles';

export type HandlerWithRole = (
  context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
) => Promise<unknown>;

/**
 * Middleware que verifica que el usuario autenticado tenga uno de los roles permitidos.
 * Debe usarse después de withAuth.
 */
export const withRole = (allowedRoles: string[], handler: HandlerWithRole) => {
  return async (
    context: Context,
    req: HttpRequest,
    log: Logger,
    user: AuthenticatedUser
  ): Promise<unknown> => {
    if (!allowedRoles.includes(user.role)) {
      log.logError(
        `Authorization failed: User ${user.email} with role '${user.role}' is not allowed. Required: ${allowedRoles.join(', ')}`
      );
      return ApiResponseBuilder.error(
        'Forbidden: You do not have permission to perform this action',
        403
      );
    }

    return await handler(context, req, log, user);
  };
};

/**
 * Verifica si el usuario tiene rol admin
 */
export const isAdmin = (user: AuthenticatedUser): boolean => {
  return user.role === USER_ROLES.ADMIN;
};

/**
 * Verifica si el usuario tiene rol client/user
 */
export const isClient = (user: AuthenticatedUser): boolean => {
  return user.role === USER_ROLES.USER;
};
