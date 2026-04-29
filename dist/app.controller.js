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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
let AppController = class AppController {
    home(res) {
        const baseUrl = process.env.SSO_BASE_URL || `http://41.216.191.39:${process.env.PORT || 4000}`;
        return res
            .status(200)
            .type('html')
            .send(`<!doctype html>
        <html lang="id">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Purbalingga SSO</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
                color: #e2e8f0;
              }
              .card {
                width: min(720px, calc(100vw - 32px));
                padding: 32px;
                border-radius: 20px;
                background: rgba(15, 23, 42, 0.78);
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
              }
              h1 {
                margin: 0 0 12px;
                font-size: 2rem;
              }
              p {
                margin: 0 0 12px;
                line-height: 1.6;
              }
              code {
                background: rgba(255, 255, 255, 0.08);
                padding: 2px 6px;
                border-radius: 6px;
              }
              .links {
                display: grid;
                gap: 8px;
                margin-top: 20px;
              }
              a {
                color: #93c5fd;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              .badge {
                display: inline-block;
                margin-bottom: 16px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(34, 197, 94, 0.15);
                color: #86efac;
                font-size: 0.9rem;
              }
            </style>
          </head>
          <body>
            <main class="card">
              <div class="badge">SSO backend aktif</div>
              <h1>Purbalingga SSO</h1>
              <p>Server ini berjalan normal dan siap melayani OAuth 2.0, OpenID Connect, serta endpoint monitoring.</p>
              <p>Base URL: <code>${baseUrl}</code></p>
              <div class="links">
                <a href="${baseUrl}/.well-known/openid-configuration">OIDC Discovery</a>
                <a href="${baseUrl}/api/validate-token">Monitoring API</a>
              </div>
            </main>
          </body>
        </html>`);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "home", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map