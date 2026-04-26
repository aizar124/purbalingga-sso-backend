import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserGender, UserRole } from './users.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  private stripSensitive(user: User) {
    if (!user) return null;
    const { password, mfaSecret, verifyToken, resetToken, ...safe } = user as any;
    return safe;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findByVerifyToken(token: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { verifyToken: token } });
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    username?: string;
    role?: UserRole;
  }): Promise<User> {
    // Cek email sudah dipakai
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email sudah terdaftar');

    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const user = this.usersRepo.create({
      ...data,
      verifyToken,
      verifyTokenExpiry,
      isVerified: false,
    });

    return this.usersRepo.save(user);
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.findByVerifyToken(token);
    if (!user) throw new NotFoundException('Token verifikasi tidak valid');
    if (user.verifyTokenExpiry < new Date()) {
      throw new Error('Token verifikasi sudah kadaluarsa');
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    return this.usersRepo.save(user);
  }

  async updateMfaSecret(userId: string, secret: string): Promise<void> {
    await this.usersRepo.update(userId, { mfaSecret: secret, mfaEnabled: true });
  }

  async disableMfa(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { mfaSecret: null, mfaEnabled: false });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(userId, { password: hashed, resetToken: null, resetTokenExpiry: null });
  }

  async setResetToken(userId: string, token: string): Promise<void> {
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await this.usersRepo.update(userId, { resetToken: token, resetTokenExpiry: expiry });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { resetToken: token } });
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    return this.stripSensitive(user);
  }

  async findManySafe(limit = 100, skip = 0) {
    const users = await this.usersRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });
    return users.map((user) => this.stripSensitive(user));
  }

  async countUsers(): Promise<number> {
    return this.usersRepo.count();
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const nextUsername =
      typeof data.username === 'string' ? data.username.trim() || null : undefined;

    if (nextUsername) {
      const existingUser = await this.findByUsername(nextUsername);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username sudah digunakan');
      }
    }

    const profilePayload = {
      name: typeof data.name === 'string' ? data.name.trim() || null : undefined,
      username: nextUsername,
      birthDate: data.birthDate || null,
      phone: typeof data.phone === 'string' ? data.phone.trim() || null : undefined,
      city: typeof data.city === 'string' ? data.city.trim() || null : undefined,
      bio: typeof data.bio === 'string' ? data.bio.trim() || null : undefined,
      gender: (data.gender as UserGender | undefined) || null,
      avatarUrl:
        typeof data.avatarUrl === 'string'
          ? data.avatarUrl.trim() || null
          : typeof data.picture === 'string'
            ? data.picture.trim() || null
            : undefined,
    };

    await this.usersRepo.update(userId, profilePayload);
    return this.findById(userId);
  }
}
