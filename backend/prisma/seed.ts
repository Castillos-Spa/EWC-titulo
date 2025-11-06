// prisma/seed.ts
import {
  PrismaClient,
  Role,
  Permission,
  Specialty,
  Area,
  ModuleKey,
  ModuleStatus,
  CompanyStatus,
  TenantStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed multitenant...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Demo Tenant',
      slug: 'default',
      status: TenantStatus.ACTIVE,
    },
  });

  const [mainCompany, secondaryCompany] = await Promise.all([
    prisma.company.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Empresa Principal',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Empresa Principal',
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Empresa Secundaria',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Empresa Secundaria',
        status: CompanyStatus.ACTIVE,
      },
    }),
  ]);

  const defaultModules = Object.values(ModuleKey) as ModuleKey[];

  await Promise.all(
    defaultModules.map(moduleKey =>
      prisma.tenantModule.upsert({
        where: {
          tenantId_module: {
            tenantId: tenant.id,
            module: moduleKey,
          },
        },
        update: { status: ModuleStatus.ACTIVE },
        create: {
          tenantId: tenant.id,
          module: moduleKey,
          status: ModuleStatus.ACTIVE,
        },
      }),
    ),
  );

  const defaultPassword = await bcrypt.hash('admin123', 10);

  const createUser = async (config: {
    username: string;
    email: string;
    areaRoles: Array<{
      area: Area;
      role: Role;
      specialty?: Specialty;
      permissions: Permission[];
      companyId?: number;
    }>;
    companyId?: number;
    extraCompanyIds?: number[];
  }) => {
    const primaryCompanyId = config.companyId ?? mainCompany.id;
    const companyIds = Array.from(
      new Set(
        [primaryCompanyId, ...(config.extraCompanyIds ?? [])].filter(
          (companyIdValue): companyIdValue is number => typeof companyIdValue === 'number',
        ),
      ),
    );

    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: config.email,
        },
      },
    });

    const user = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: config.email,
        },
      },
      update: {
        username: config.username,
        password: defaultPassword,
        mustChangePassword: false,
        active: true,
        primaryCompanyId,
        userCompanies: {
          deleteMany: {},
          create: companyIds.map(companyIdValue => ({
            tenantId: tenant.id,
            companyId: companyIdValue,
            isDefault: companyIdValue === primaryCompanyId,
          })),
        },
        roleAssignments: {
          deleteMany: {},
          create: config.areaRoles.map(roleConfig => ({
            tenantId: tenant.id,
            area: roleConfig.area,
            role: roleConfig.role,
            specialty: roleConfig.specialty ?? null,
            permissions: roleConfig.permissions,
            companyId: roleConfig.companyId ?? primaryCompanyId,
          })),
        },
      },
      create: {
        tenantId: tenant.id,
        username: config.username,
        email: config.email,
        password: defaultPassword,
        mustChangePassword: false,
        active: true,
        primaryCompanyId,
        userCompanies: {
          create: companyIds.map(companyIdValue => ({
            tenantId: tenant.id,
            companyId: companyIdValue,
            isDefault: companyIdValue === primaryCompanyId,
          })),
        },
        roleAssignments: {
          create: config.areaRoles.map(roleConfig => ({
            tenantId: tenant.id,
            area: roleConfig.area,
            role: roleConfig.role,
            specialty: roleConfig.specialty ?? null,
            permissions: roleConfig.permissions,
            companyId: roleConfig.companyId ?? primaryCompanyId,
          })),
        },
      },
    });

    console.log(`${existingUser ? '🔄 Usuario actualizado' : '✅ Usuario creado'}: ${user.username}`);
  };

  await createUser({
    username: 'admin',
    email: 'admin@empresa.cl',
    areaRoles: [
      {
        area: Area.IT,
        role: Role.Admin,
        permissions: Object.values(Permission),
      },
    ],
  });

  await createUser({
    username: 'jefe.it',
    email: 'jefe.it@empresa.cl',
    areaRoles: [
      {
        area: Area.IT,
        role: Role.Jefe,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.MANAGE_TICKETS,
          Permission.VIEW_MANAGEMENT_USER,
          Permission.MANAGE_MANAGEMENT_USER,
        ],
      },
    ],
  });

  await createUser({
    username: 'sup.transporte',
    email: 'supervisor.transporte@empresa.cl',
    areaRoles: [
      {
        area: Area.Transporte,
        role: Role.Supervisor,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.MANAGE_TICKETS,
          Permission.MANAGE_ROUTES,
          Permission.MANAGE_FLEET,
          Permission.VIEW_TRIP_REPORTS,
          Permission.VIEW_ROUTES,
          Permission.VIEW_FLEET,
          Permission.VIEW_MAINTENANCE,
          Permission.MANAGE_MAINTENANCE,
        ],
      },
    ],
  });

  await createUser({
    username: 'driver01',
    email: 'driver01@empresa.cl',
    areaRoles: [
      {
        area: Area.Transporte,
        role: Role.Especialista,
        specialty: Specialty.DRIVER,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.VIEW_TRIP_REPORTS,
          Permission.MANAGE_TRIP_REPORTS,
          Permission.VIEW_ROUTES,
        ],
      },
    ],
  });

  await createUser({
    username: 'sup.aseo',
    email: 'supervisor.aseo@empresa.cl',
    areaRoles: [
      {
        area: Area.Aseo,
        role: Role.Supervisor,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.MANAGE_TICKETS,
          Permission.VIEW_CLEANING_REPORTS,
          Permission.MANAGE_CLEANING_REPORTS,
        ],
      },
    ],
    companyId: secondaryCompany.id,
  });

  await createUser({
    username: 'coordinador.multi',
    email: 'coordinador.multi@empresa.cl',
    areaRoles: [
      {
        area: Area.Transporte,
        role: Role.Jefe,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.MANAGE_TICKETS,
          Permission.MANAGE_ROUTES,
          Permission.MANAGE_FLEET,
          Permission.VIEW_TRIP_REPORTS,
          Permission.MANAGE_TRIP_REPORTS,
          Permission.VIEW_ROUTES,
          Permission.VIEW_FLEET,
          Permission.VIEW_MAINTENANCE,
          Permission.MANAGE_MAINTENANCE,
        ],
        companyId: mainCompany.id,
      },
      {
        area: Area.Aseo,
        role: Role.Supervisor,
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_TICKETS,
          Permission.MANAGE_TICKETS,
          Permission.VIEW_CLEANING_REPORTS,
          Permission.MANAGE_CLEANING_REPORTS,
        ],
        companyId: secondaryCompany.id,
      },
    ],
    extraCompanyIds: [secondaryCompany.id],
  });

  const totalUsers = await prisma.user.count({ where: { tenantId: tenant.id } });
  console.log(`\n✅ Seed completado para el tenant ${tenant.slug}. Usuarios creados: ${totalUsers}`);
  console.log('🔑 Contraseña para todos: admin123');
}

async function runSeed() {
  try {
    await main();
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-top-level-await
runSeed();
