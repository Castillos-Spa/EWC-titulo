import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role, Specialty } from '@prisma/client';

// DTO para una asignación de rol individual
export class RoleAssignmentDto {
  @IsString()
  @IsNotEmpty()
  area: string; // 'IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role; // Admin, Jefe, Supervisor, Especialista, Trabajador, Lector

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty; // Solo para especialistas

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalPermissions?: string[]; // Permisos extra si es necesario
}

// DTO principal para registro completo
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string; // Si no se proporciona, se genera automáticamente

  @IsBoolean()
  @IsOptional()
  active?: boolean; // Por defecto true

  // 🎯 SISTEMA NUEVO: Array de asignaciones de roles
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe tener al menos una asignación de rol' })
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roleAssignments: RoleAssignmentDto[];
}

// DTO simplificado para casos comunes (un solo rol)
export class SimpleRegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // 🎯 UN SOLO ROL Y ÁREA
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalPermissions?: string[];
}

// DTO para actualizar roles de usuario existente
export class UpdateUserRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roleAssignments: RoleAssignmentDto[];
}

// DTO para asignar un rol adicional a un usuario
export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalPermissions?: string[];
}

// DTO para remover un rol específico
export class RemoveRoleDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

// DTO para cambiar contraseña
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

// DTO para login
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// DTO para verificar permisos
export class CheckPermissionDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsString()
  @IsNotEmpty()
  permission: string;
}

// DTO para verificar roles
export class CheckRoleDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

// DTO para actualizar información básica del usuario
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
