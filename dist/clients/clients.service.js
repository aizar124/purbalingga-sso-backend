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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const clients_entity_1 = require("./clients.entity");
const crypto = require("crypto");
let ClientsService = class ClientsService {
    constructor(clientsRepo) {
        this.clientsRepo = clientsRepo;
    }
    async findByClientId(clientId) {
        return this.clientsRepo.findOne({ where: { clientId, isActive: true } });
    }
    async validateClient(clientId, redirectUri) {
        const client = await this.findByClientId(clientId);
        if (!client)
            return null;
        if (!client.redirectUris.includes(redirectUri))
            return null;
        return client;
    }
    async validateClientCredentials(clientId, clientSecret) {
        const client = await this.findByClientId(clientId);
        if (!client)
            return null;
        if (client.clientSecret !== clientSecret)
            return null;
        return client;
    }
    async create(data) {
        const clientId = 'client_' + crypto.randomBytes(8).toString('hex');
        const plainSecret = crypto.randomBytes(32).toString('hex');
        const client = this.clientsRepo.create({
            ...data,
            clientId,
            clientSecret: plainSecret,
        });
        const saved = await this.clientsRepo.save(client);
        return { ...saved, plainSecret };
    }
    async findAll() {
        return this.clientsRepo.find();
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(clients_entity_1.OAuthClient)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientsService);
//# sourceMappingURL=clients.service.js.map