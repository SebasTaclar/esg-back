import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getAuthService } from '../src/shared/serviceProvider';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { withRole } from '../src/shared/roleMiddleware';

const funcChangePassword = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const method = req.method?.toUpperCase();

  if (method === 'PATCH') {
    const { newPassword, userId } = req.body || {};

    if (!newPassword) {
      return ApiResponseBuilder.validationError(['newPassword is required']);
    }

    if (!userId) {
      return ApiResponseBuilder.validationError(['userId is required']);
    }

    const authService = getAuthService(log);
    await authService.changePassword(userId.toString(), newPassword);
    return ApiResponseBuilder.success(null, 'Password changed successfully');
  }

  return ApiResponseBuilder.methodNotAllowed('Only PATCH method is allowed');
};

export default withAuthenticatedApiHandler(withRole(['admin'], funcChangePassword));
