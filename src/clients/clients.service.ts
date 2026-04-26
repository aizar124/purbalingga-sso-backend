import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthClient } from './clients.entity';
import * as crypto from 'crypto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(OAuthClient)
    private clientsRepo: Repository<OAuthClient>,
  ) {}

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.clientsRepo.findOne({ where: { clientId, isActive: true } });
  }

  async validateClient(clientId: string, redirectUri: string): Promise<OAuthClient | null> {
    const client = await this.findByClientId(clientId);
    if (!client) return null;
    if (!client.redirectUris.includes(redirectUri)) return null;
    return client;
  }

  async validateClientCredentials(clientId: string, clientSecret: string): Promise<OAuthClient | null> {
    const client = await this.findByClientId(clientId);
    if (!client) return null;
    if (client.clientSecret !== clientSecret) return null;
    return client;
  }

  async create(data: {
    name: string;
    redirectUris: string[];
    allowedScopes?: string[];
    logoUrl?: string;
    description?: string;
  }): Promise<OAuthClient & { plainSecret: string }> {
    const clientId     = 'client_' + crypto.randomBytes(8).toString('hex');
    const plainSecret  = crypto.randomBytes(32).toString('hex');

    const client = this.clientsRepo.create({
      ...data,
      clientId,
      clientSecret: plainSecret, // Produksi: hash ini dengan bcrypt
    });

    const saved = await this.clientsRepo.save(client);
    return { ...saved, plainSecret };
  }

  async findAll(): Promise<OAuthClient[]> {
    return this.clientsRepo.find();
  }
}
