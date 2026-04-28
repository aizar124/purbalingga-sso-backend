import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  home(@Res() res: Response) {
    const baseUrl = process.env.SSO_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

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
}
