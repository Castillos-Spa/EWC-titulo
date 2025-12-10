import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import axios from 'axios';

type MailTransportOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private options: MailTransportOptions | null = null;
  private graphEnabled = false;
  private graph: { tenantId: string; clientId: string; clientSecret: string; sender: string } | null = null;

  constructor() {
    // Support both MAIL_SMTP_* and SMTP_* variable names
    const host = process.env.SMTP_HOST ?? process.env.MAIL_SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? process.env.MAIL_SMTP_PORT ?? 587);
    const secureRaw = (process.env.SMTP_SECURE ?? process.env.MAIL_SMTP_SECURE ?? 'false').toString().toLowerCase();
    const secure = ['true', '1', 'yes'].includes(secureRaw);
    const user = process.env.SMTP_USER ?? process.env.MAIL_SMTP_USER;
    const pass = process.env.SMTP_PASS ?? process.env.MAIL_SMTP_PASS;
    const from = process.env.MAIL_FROM ?? process.env.SMTP_FROM ?? user ?? '';

    // Microsoft Graph configuration
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;
    const graphSender = process.env.GRAPH_SENDER_USER ?? process.env.GRAPH_SENDER ?? from;

    if (tenantId && clientId && clientSecret && graphSender) {
      this.graphEnabled = true;
      this.graph = { tenantId, clientId, clientSecret, sender: graphSender };
      this.options = { host: '', port: 0, secure: false, from: graphSender } as MailTransportOptions;
      this.logger.log('MailService enabled with Microsoft Graph');
      return;
    }

    if (!host || !from) {
      this.logger.warn('MailService disabled: missing Graph or SMTP configuration');
      return;
    }

    this.options = {
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      from,
    };

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: this.options.auth,
    });
  }

  async sendBukWelcomeEmail(params: { to: string; employeeEmail: string; tempPassword: string }): Promise<void> {
    // Try Microsoft Graph first when enabled
    if (this.graphEnabled && this.graph) {
      try {
        await this.sendViaGraph(params);
        return;
      } catch (err) {
        const e = err as Error;
        this.logger.warn(`Falling back from Graph to SMTP/Ethereal: ${e.message}`);
      }
    }
    // Then try configured SMTP
    if (this.transporter && this.options) {
      try {
        const subject = 'Registro de cuenta EWC — credenciales temporales';
        const text = [
          'Hola,',
          '',
          'Se logró con éxito el registro de tu cuenta.',
          `Email del trabajador: ${params.employeeEmail}`,
          `Password temporal: ${params.tempPassword}`,
          '',
          'Por favor inicia sesión y cambia tu contraseña.',
        ].join('\n');

        const html = `
          <p>Se logró con éxito el registro de tu cuenta.</p>
          <p><strong>Email del trabajador:</strong> ${params.employeeEmail}</p>
          <p><strong>Password temporal:</strong> ${params.tempPassword}</p>
          <p>Por favor inicia sesión y cambia tu contraseña.</p>
        `;

        await this.transporter.sendMail({
          from: this.options.from,
          to: params.to,
          subject,
          text,
          html,
        });
        return;
      } catch (err) {
        const e = err as Error;
        this.logger.warn(`SMTP send failed, will attempt Ethereal: ${e.message}`);
      }
    }

    // Finally, Ethereal fallback for quick testing without external setup
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transport = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const subject = 'Registro de cuenta EWC — credenciales temporales';
      const html = `
        <p>Se logró con éxito el registro de tu cuenta.</p>
        <p><strong>Email del trabajador:</strong> ${params.employeeEmail}</p>
        <p><strong>Password temporal:</strong> ${params.tempPassword}</p>
        <p>Por favor inicia sesión y cambia tu contraseña.</p>
      `;
      const info = await transport.sendMail({
        from: 'no-reply@ethereal.email',
        to: params.to,
        subject,
        html,
      });
      this.logger.log(`Ethereal email sent: preview=${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      const e = err as Error;
      this.logger.warn(`Ethereal send failed: ${e.message}`);
    }
  }

  private async sendViaGraph(params: { to: string; employeeEmail: string; tempPassword: string }) {
    if (!this.graph) return;

    const token = await this.getGraphToken();
    const subject = 'Registro de cuenta EWC — credenciales temporales';
    const html = `
      <p>Se logró con éxito el registro de tu cuenta.</p>
      <p><strong>Email del trabajador:</strong> ${params.employeeEmail}</p>
      <p><strong>Password temporal:</strong> ${params.tempPassword}</p>
      <p>Por favor inicia sesión y cambia tu contraseña.</p>
    `;

    const body = {
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: params.to } }],
        from: { emailAddress: { address: this.options?.from ?? this.graph.sender } },
      },
      saveToSentItems: true,
    };

    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.graph.sender)}/sendMail`;
    try {
      await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      const e = err as any;
      const status = e?.response?.status;
      const data = e?.response?.data;
      this.logger.warn(`Graph sendMail failed: status=${status} body=${this.safeJson(data)}`);
      throw e;
    }
  }

  private async getGraphToken(): Promise<string> {
    if (!this.graph) throw new Error('Graph not configured');
    const url = `https://login.microsoftonline.com/${this.graph.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.graph.clientId,
      client_secret: this.graph.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });
    try {
      const res = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return res.data.access_token as string;
    } catch (err) {
      const e = err as any;
      const status = e?.response?.status;
      const data = e?.response?.data;
      this.logger.warn(`Graph token failed: status=${status} body=${this.safeJson(data)}`);
      throw e;
    }
  }

  private safeJson(obj: unknown): string {
    try {
      return typeof obj === 'string' ? obj : JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  }
}
