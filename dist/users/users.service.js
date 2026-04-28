"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_entity_1 = require("./users.entity");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    async findById(id) {
        return this.usersRepo.findOne({ where: { id } });
    }
    stripSensitive(user) {
        if (!user)
            return null;
        const { password, mfaSecret, verifyToken, resetToken, ...safe } = user;
        return safe;
    }
    async findByEmail(email) {
        return this.usersRepo.findOne({ where: { email } });
    }
    async findByUsername(username) {
        return this.usersRepo.findOne({ where: { username } });
    }
    async findByVerifyToken(token) {
        return this.usersRepo.findOne({ where: { verifyToken: token } });
    }
    async create(data) {
        const existing = await this.findByEmail(data.email);
        if (existing)
            throw new common_1.ConflictException('Email sudah terdaftar');
        const verifyToken = (0, uuid_1.v4)();
        const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = this.usersRepo.create({
            ...data,
            verifyToken,
            verifyTokenExpiry,
            isVerified: false,
        });
        return this.usersRepo.save(user);
    }
    async verifyEmail(token) {
        const user = await this.findByVerifyToken(token);
        if (!user)
            throw new common_1.NotFoundException('Token verifikasi tidak valid');
        if (user.verifyTokenExpiry < new Date()) {
            throw new Error('Token verifikasi sudah kadaluarsa');
        }
        user.isVerified = true;
        user.verifyToken = null;
        user.verifyTokenExpiry = null;
        return this.usersRepo.save(user);
    }
    async updateMfaSecret(userId, secret) {
        await this.usersRepo.update(userId, { mfaSecret: secret, mfaEnabled: true });
    }
    async disableMfa(userId) {
        await this.usersRepo.update(userId, { mfaSecret: null, mfaEnabled: false });
    }
    async updatePassword(userId, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.usersRepo.update(userId, { password: hashed, resetToken: null, resetTokenExpiry: null });
    }
    async setResetToken(userId, token) {
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.usersRepo.update(userId, { resetToken: token, resetTokenExpiry: expiry });
    }
    async findByResetToken(token) {
        return this.usersRepo.findOne({ where: { resetToken: token } });
    }
    async getProfile(userId) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
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
    async countUsers() {
        return this.usersRepo.count();
    }
    async updateProfile(userId, data) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        const nextUsername = typeof data.username === 'string' ? data.username.trim() || null : undefined;
        if (nextUsername) {
            const existingUser = await this.findByUsername(nextUsername);
            if (existingUser && existingUser.id !== userId) {
                throw new common_1.ConflictException('Username sudah digunakan');
            }
        }
        const profilePayload = {
            name: typeof data.name === 'string' ? data.name.trim() || null : undefined,
            username: nextUsername,
            birthDate: data.birthDate || null,
            phone: typeof data.phone === 'string' ? data.phone.trim() || null : undefined,
            city: typeof data.city === 'string' ? data.city.trim() || null : undefined,
            bio: typeof data.bio === 'string' ? data.bio.trim() || null : undefined,
            gender: data.gender || null,
            avatarUrl: typeof data.avatarUrl === 'string'
                ? data.avatarUrl.trim() || null
                : typeof data.picture === 'string'
                    ? data.picture.trim() || null
                    : undefined,
        };
        await this.usersRepo.update(userId, profilePayload);
        return this.findById(userId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map