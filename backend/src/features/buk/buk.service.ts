import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { AxiosError } from 'axios';
import { UsersService } from '@/features/users/users.service';
import { Role } from '@prisma/client';
import { CreateBukUserDto } from './dto/create-buk-user.dto';

export interface BukUser {
  id: number;
  name: string;
  email: string;
  activated: boolean;
  person_id?: number;
  existsInApp: boolean;
}

export interface BukUsersDebugPayload {
  raw: unknown;
  users: BukUser[];
  meta: {
    total: number;
  };
}

export interface BukUsersPaginatedResponse {
  data: BukUser[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class BukService {
  private readonly logger = new Logger(BukService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async fetchUsers(page = 1, pageSize = 10): Promise<BukUsersPaginatedResponse> {
    const payload = await this.performRequest();
    this.logWebhookPayload(payload);
    const users = await this.prepareUsers(payload);
    const paginated = this.paginate(users, page, pageSize);
    return {
      data: paginated.items,
      meta: {
        total: paginated.total,
        page: paginated.page,
        pageSize: paginated.pageSize,
        totalPages: paginated.totalPages,
      },
    };
  }

  async fetchUsersDebug(): Promise<BukUsersDebugPayload> {
    const payload = await this.performRequest();
    this.logWebhookPayload(payload);
    const users = await this.prepareUsers(payload);
    return {
      raw: payload,
      users,
      meta: {
        total: users.length,
      },
    };
  }

  async registerBukUser(input: CreateBukUserDto): Promise<unknown> {
    // New behavior: register directly in the app (no external webhook)
    // 1) Fetch Buk users payload and locate the requested employee by id_buk
    const payload = await this.performRequest();
    const users = await this.prepareUsers(payload);
    const match = users.find(u => u.id === Number(input.id_buk));
    if (!match) {
      throw new HttpException(`Empleado BUK id=${input.id_buk} no encontrado`, HttpStatus.NOT_FOUND);
    }

    // 2) Build minimal register dto
    const defaultArea = this.configService.get<string>('DEFAULT_REGISTER_AREA') ?? 'IT';
    const defaultRoleName = this.configService.get<string>('DEFAULT_REGISTER_ROLE') ?? 'Trabajador';
    const roleEnum = (Role as unknown as Record<string, Role>)[defaultRoleName] ?? Role.Trabajador;
    const email = match.email?.trim();
    if (!email) {
      throw new HttpException('El empleado BUK no tiene correo válido', HttpStatus.BAD_REQUEST);
    }
    const username = (email.split('@')[0] || match.name || `user_${match.id}`).toLowerCase();

    const registerDto = {
      username,
      email,
      active: true,
      roleAssignments: [
        {
          area: defaultArea,
          role: roleEnum,
        },
      ],
    } as any; // shape compatible with RegisterDto

    const result = await this.usersService.register(registerDto);
    return { success: true, user: result.user, tempPassword: result.tempPassword };
  }

  private async performRequest(): Promise<unknown> {
    const url = this.configService.get<string>('BUK_WEBHOOK_URL');
    if (!url) {
      throw new HttpException('BUK webhook URL is not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<unknown>(url, {
          headers: this.buildFetchHeaders(),
          params: this.buildFetchParams(),
          responseType: 'json',
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? HttpStatus.BAD_GATEWAY;
      const rawMessage = axiosError.response?.data ?? axiosError.message;
      const serialized = (() => {
        if (typeof rawMessage === 'string') return rawMessage;
        try {
          return JSON.stringify(rawMessage);
        } catch {
          return String(rawMessage);
        }
      })();
      this.logger.error(`Error fetching Buk users: status=${status} body=${serialized}`);
      throw new HttpException(`Error fetching Buk users: ${serialized}`, status);
    }
  }

  private logWebhookPayload(payload: unknown): void {
    this.logger.log(`Buk webhook raw payload preview: ${this.formatForLog(payload)}`);
  }

  private logCreateRequest(url: string, headers: Record<string, string> | undefined, payload: unknown): void {
    this.logger.log(
      `Buk register request url=${url} headers=${JSON.stringify(headers ?? {})} payload=${this.formatForLog(payload)}`,
    );
  }

  private logCreateResponse(status: number, payload: unknown): void {
    this.logger.log(`Buk register response status=${status} payload=${this.formatForLog(payload)}`);
  }

  private buildFetchHeaders(): Record<string, string> | undefined {
    const token = this.configService.get<string>('BUK_API_TOKEN');
    if (!token) {
      this.logger.warn('BUK API token is not configured; request will be sent without authentication header');
      return undefined;
    }
    return {
      auth_token: token,
      Accept: 'application/json',
    };
  }

  private buildFetchParams(): Record<string, string> | undefined {
    const token = this.configService.get<string>('BUK_API_TOKEN');
    if (!token) return undefined;
    return { auth_token: token };
  }

  private buildHeaders(): Record<string, string> | undefined {
    const headerValue = this.configService.get<string>('BUK_WEBHOOK_HEADER_VALUE');
    if (!headerValue) return undefined;
    const headerName = this.configService.get<string>('BUK_WEBHOOK_HEADER_NAME') ?? 'backend';
    return { [headerName]: headerValue };
  }

  private formatForLog(payload: unknown): string {
    try {
      const json = JSON.stringify(payload, null, 2);
      if (!json) return '[empty json]';
      if (json.length <= 2000) return json;
      return `${json.slice(0, 2000)}... [truncated]`;
    } catch {
      return String(payload ?? '[undefined payload]');
    }
  }

  private async prepareUsers(payload: unknown): Promise<BukUser[]> {
    const normalized = this.normalizePayload(payload);
    return this.markExistingUsers(normalized);
  }

  private normalizePayload(payload: unknown): BukUser[] {
    const rawUsers = this.extractRawUsers(payload);
    return rawUsers.map((raw, index) => this.toBukUser(raw, index)).filter((user): user is BukUser => user !== null);
  }

  private extractRawUsers(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload)) {
      return this.asRecordArray(payload);
    }

    if (payload && typeof payload === 'object') {
      const root = payload as { data?: unknown } & Record<string, unknown>;
      const candidateArrays: unknown[] = [];

      candidateArrays.push(root.data);

      if (root.data && typeof root.data === 'object') {
        candidateArrays.push(...Object.values(root.data));
      }

      candidateArrays.push(...Object.values(root));

      for (const candidate of candidateArrays) {
        if (Array.isArray(candidate)) {
          const records = this.asRecordArray(candidate);
          if (records.length > 0) return records;
        }
      }
    }

    return [];
  }

  private asRecordArray(collection: unknown[]): Record<string, unknown>[] {
    return collection.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object');
  }

  private toBukUser(raw: Record<string, unknown>, index: number): BukUser | null {
    const bukId = this.toNumber(raw.ID_BUK ?? raw.id ?? raw.buk_id ?? raw.bukId);
    const personId = this.toNumber(raw.person_id ?? raw.personId ?? raw.personID);
    const name = this.toString(raw.nombre_completo ?? raw.nombreCompleto ?? raw.full_name ?? raw.fullName ?? raw.name);
    const email = this.toString(raw.email ?? raw.mail ?? raw.correo ?? raw.email_address);
    const activated = this.toBoolean(raw.activated ?? raw.active ?? raw.activo, true);

    if (!bukId && !personId && !name && !email) {
      return null;
    }

    return {
      id: bukId ?? personId ?? index + 1,
      name: name ?? 'Sin nombre',
      email: email ?? '',
      activated,
      person_id: personId,
      existsInApp: false,
    };
  }

  private async markExistingUsers(users: BukUser[]): Promise<BukUser[]> {
    const emailList = users.map(user => user.email?.toLowerCase()).filter((email): email is string => Boolean(email));

    if (emailList.length === 0) {
      return users;
    }

    const existingEmails = await this.usersService.findExistingEmails(emailList);

    return users.map(user => ({
      ...user,
      existsInApp: user.email ? existingEmails.has(user.email.toLowerCase()) : false,
    }));
  }

  private paginate(users: BukUser[], page: number, pageSize: number) {
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const total = users.length;
    const totalPages = Math.max(Math.ceil(total / safePageSize), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * safePageSize;
    const items = users.slice(start, start + safePageSize);

    return { items, total, page: safePage, pageSize: safePageSize, totalPages };
  }

  private buildCreatePayload(dto: CreateBukUserDto) {
    return { id_buk: dto.id_buk };
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private toString(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return undefined;
  }

  private toBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'si', 'sí', 'activo', 'activa'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n', 'inactive', 'inactivo', 'inactiva'].includes(normalized)) {
        return false;
      }
    }
    return defaultValue;
  }
}
