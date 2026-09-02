import { generateToken } from '../../shared/jwtHelper';
import { Logger } from '../../shared/Logger';
import { PasswordUtils } from '../../shared/PasswordUtils';
import { ValidationError, AuthenticationError, ConflictError } from '../../shared/exceptions';
import { IUserDataSource, UserWithClients } from '../../domain/interfaces/IUserDataSource';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  name: string;
  membershipPaid: boolean;
}

export interface CreateUserRequest {
  clientId: number;
  password: string;
}

export class AuthService {
  private logger: Logger;
  private userDataSource: IUserDataSource;
  private clientDataSource: IClientDataSource;

  constructor(logger: Logger, userDataSource: IUserDataSource, clientDataSource: IClientDataSource) {
    this.logger = logger;
    this.userDataSource = userDataSource;
    this.clientDataSource = clientDataSource;
  }

  async login(loginRequest: LoginRequest): Promise<string> {
    const { email, password } = loginRequest;

    this.logger.logInfo(`Login attempt for user: ${email}`);

    if (!email || !password) {
      this.logger.logWarning('Login failed: missing email or password');
      throw new ValidationError('Email and password are required');
    }

    // Get user by email from data source
    const user = await this.userDataSource.getByEmail(email);

    if (!user) {
      this.logger.logWarning(`Login failed for user: ${email} - user not found`);
      throw new AuthenticationError('Invalid credentials');
    }

    // Validate password using centralized utility
    const isValidPassword = await PasswordUtils.comparePassword(password, user.password);

    if (!isValidPassword) {
      this.logger.logWarning(`Login failed for user: ${email} - invalid password`);
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      membershipPaid: user.membershipPaid,
    });

    this.logger.logInfo(`Login successful for user: ${email} with role: ${user.role}`);

    return token;
  }

  async createUser(createUserRequest: CreateUserRequest): Promise<UserInfo> {
    const { clientId, password } = createUserRequest;

    this.logger.logInfo(`Creating user for client: ${clientId}`);

    if (!clientId || !password) {
      throw new ValidationError('clientId and password are required');
    }

    // Validate password requirements
    PasswordUtils.validatePassword(password);

    // Lookup client
    const targetClient = await this.clientDataSource.getById(clientId);
    if (!targetClient) {
      throw new ValidationError('Client not found');
    }

    // Check if client already has a user assigned
    if (targetClient.userId) {
      throw new ConflictError('Client already has a user assigned');
    }

    // Check if a user with this email already exists
    const existingUser = await this.userDataSource.getByEmail(targetClient.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user with client data, role hardcoded as "user"
    const newUser = {
      id: 0,
      email: targetClient.email,
      password: hashedPassword,
      name: targetClient.name,
      role: 'user',
      membershipPaid: false,
    };

    try {
      const createdUser = await this.userDataSource.create(newUser);

      // Link client to user
      await this.clientDataSource.update(clientId, { userId: createdUser.id });
      this.logger.logInfo(`Client ${clientId} linked to user ${createdUser.id}`);

      this.logger.logInfo(`User created successfully: ${targetClient.email}`);

      return {
        id: createdUser.id.toString(),
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        membershipPaid: createdUser.membershipPaid,
      };
    } catch (error) {
      this.logger.logError(`Error creating user for client ${clientId}`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserWithClients[]> {
    this.logger.logInfo('Fetching all users with clients');
    return await this.userDataSource.getAllWithClients();
  }

  async changePassword(targetUserId: string, newPassword: string): Promise<void> {
    this.logger.logInfo(`Password change requested for user: ${targetUserId}`);

    if (!newPassword) {
      throw new ValidationError('New password is required');
    }

    PasswordUtils.validatePassword(newPassword);

    const user = await this.userDataSource.getById(targetUserId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const isSamePassword = await PasswordUtils.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    const hashedPassword = await PasswordUtils.hashPassword(newPassword);
    await this.userDataSource.update(targetUserId, { password: hashedPassword });

    this.logger.logInfo(`Password changed successfully for user: ${targetUserId}`);
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.logInfo(`Delete requested for user: ${id}`);

    const user = await this.userDataSource.getById(id);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Unlink associated clients before deleting
    const clients = await this.clientDataSource.getByUserId(parseInt(id));
    if (clients.length > 0) {
      this.logger.logInfo(`Unlinking ${clients.length} clients from user ${id}`);
      for (const client of clients) {
        await this.clientDataSource.update(client.id, { userId: null });
      }
    }

    const deleted = await this.userDataSource.delete(id);
    if (!deleted) {
      throw new ValidationError('Failed to delete user');
    }

    this.logger.logInfo(`User deleted successfully: ${id}`);
  }
}
