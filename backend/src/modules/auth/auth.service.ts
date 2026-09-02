import argon2 from 'argon2';
import crypto from 'crypto';
import { User, IUser } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from '../../utils/token.js';
import {
  ConflictError,
  UnauthorizedError,
} from '../../errors/AppError.js';
import { SignupInput, LoginInput } from './auth.validation.js';

export class AuthService {
  public async signup(input: SignupInput): Promise<{ user: Partial<IUser> }> {
    const existingUser = await User.findOne({
      $or: [{ email: input.email.toLowerCase() }, { phone: input.phone }],
    });

    if (existingUser) {
      throw new ConflictError('User with this email or phone number already exists');
    }

    const passwordHash = await argon2.hash(input.password);

    const user = await User.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      isActive: true,
      isSuperAdmin: false,
    });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  public async login(input: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: Partial<IUser>;
  }> {
    const isEmail = input.identifier.includes('@');
    const query = isEmail
      ? { email: input.identifier.toLowerCase() }
      : { phone: input.identifier };

    const user = await User.findOne(query);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials or account inactive');
    }

    const isMatch = await argon2.verify(user.passwordHash, input.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const family = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      family,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 minutes (in seconds)
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  public async refreshTokens(rawToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const incomingHash = hashToken(rawToken);

    const existingToken = await RefreshToken.findOne({ tokenHash: incomingHash });

    if (!existingToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (existingToken.isRevoked) {
      // Possible token reuse attack: revoke all tokens in this family
      await RefreshToken.updateMany(
        { family: existingToken.family },
        { isRevoked: true }
      );
      throw new UnauthorizedError('Compromised token detected. Please sign in again.');
    }

    existingToken.isRevoked = true;
    await existingToken.save();

    const user = await User.findById(existingToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User is no longer active');
    }

    const newAccessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });

    const newRawRefreshToken = generateRefreshTokenString();
    const newHash = hashToken(newRawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newHash,
      family: existingToken.family, // Maintain family for sliding rotation
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900,
    };
  }

  public async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  }
}

export const authService = new AuthService();
