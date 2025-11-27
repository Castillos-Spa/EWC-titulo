// prisma/seed.ts
import { PrismaClient, Role, Permission, Specialty, Area } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de usuarios...');

  const defaultPassword = await bcrypt.hash('admin123', 10);

  // ============================================
  // 1. ADMINISTRADOR DEL SISTEMA
  // ============================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.cl' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: Area.IT,
          role: Role.Admin,
          permissions: Object.values(Permission), // Admin tiene todos los permisos
        },
      },
    },
  });
  console.log('✅ Admin creado:', admin.username);

  // ============================================
  // 1.1. BRUNO (ADMINISTRADOR)
  // ============================================
  const bruno = await prisma.user.upsert({
    where: { email: 'bruno@admin.cl' },
    update: {},
    create: {
      username: 'bruno',
      email: 'bruno@admin.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: Area.Admin,
          role: Role.Admin,
          permissions: Object.values(Permission), // Admin tiene todos los permisos
        },
      },
    },
  });
  console.log('✅ Bruno (Admin) creado:', bruno.username);

  // ============================================
  // 2. JEFE DE IT
  // ============================================
  const jefeIT = await prisma.user.upsert({
    where: { email: 'jefe.it@empresa.cl' },
    update: {},
    create: {
      username: 'jefe.it',
      email: 'jefe.it@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
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
      },
    },
  });
  console.log('✅ Jefe IT creado:', jefeIT.username);

  // ============================================
  // 3. SUPERVISOR DE TRANSPORTE
  // ============================================
  const supervisorTransporte = await prisma.user.upsert({
    where: { email: 'supervisor.transporte@empresa.cl' },
    update: {},
    create: {
      username: 'sup.transporte',
      email: 'supervisor.transporte@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
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
      },
    },
  });
  console.log('✅ Supervisor Transporte creado:', supervisorTransporte.username);

  // ============================================
  // 4. DRIVER (Especialista)
  // ============================================
  const driver = await prisma.user.upsert({
    where: { email: 'driver01@empresa.cl' },
    update: {},
    create: {
      username: 'driver01',
      email: 'driver01@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
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
      },
    },
  });
  console.log('✅ Driver creado:', driver.username);

  // ============================================
  // 5. MECÁNICO (Especialista)
  // ============================================
  const mecanico = await prisma.user.upsert({
    where: { email: 'mecanico01@empresa.cl' },
    update: {},
    create: {
      username: 'mecanico01',
      email: 'mecanico01@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: Area.Transporte,
          role: Role.Especialista,
          specialty: Specialty.MECHANIC,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_FLEET,
            Permission.VIEW_MAINTENANCE,
            Permission.MANAGE_MAINTENANCE,
          ],
        },
      },
    },
  });
  console.log('✅ Mecánico creado:', mecanico.username);

  // ============================================
  // 6. JEFE DE OBRAS (+ Lector en P_Riesgo)
  // ============================================
  const jefeObras = await prisma.user.upsert({
    where: { email: 'jefe.obras@empresa.cl' },
    update: {},
    create: {
      username: 'jefe.obras',
      email: 'jefe.obras@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: [
          {
            area: Area.Obras,
            role: Role.Jefe,
            permissions: [
              Permission.VIEW_DASHBOARD,
              Permission.VIEW_TICKETS,
              Permission.MANAGE_TICKETS,
              Permission.VIEW_CIVIL_WORKS,
              Permission.MANAGE_CIVIL_WORKS,
              Permission.VIEW_MANAGEMENT_USER,
            ],
          },
          {
            area: Area.Prev_Riesgo,
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_RISK_ASSESSMENTS],
          },
        ],
      },
    },
  });
  console.log('✅ Jefe Obras creado:', jefeObras.username);

  // ============================================
  // 8. SUPERVISOR DE ASEO
  // ============================================
  const supervisorAseo = await prisma.user.upsert({
    where: { email: 'supervisor.aseo@empresa.cl' },
    update: {},
    create: {
      username: 'sup.aseo',
      email: 'supervisor.aseo@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
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
      },
    },
  });
  console.log('✅ Supervisor Aseo creado:', supervisorAseo.username);

  // ============================================
  // 14. TRABAJADOR GENERAL (múltiples áreas)
  // ============================================
  const trabajadorGeneral = await prisma.user.upsert({
    where: { email: 'trabajador@empresa.cl' },
    update: {},
    create: {
      username: 'trabajador.general',
      email: 'trabajador@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: [
          {
            area: Area.Obras,
            role: Role.Trabajador,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_CIVIL_WORKS],
          },
          {
            area: Area.Aseo,
            role: Role.Trabajador,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_CLEANING_REPORTS],
          },
        ],
      },
    },
  });
  console.log('✅ Trabajador General creado:', trabajadorGeneral.username);

  // ============================================
  // 15. LECTOR GENERAL (solo consulta)
  // ============================================
  const lectorGeneral = await prisma.user.upsert({
    where: { email: 'lector@empresa.cl' },
    update: {},
    create: {
      username: 'lector.general',
      email: 'lector@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: [
          {
            area: Area.IT,
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS],
          },
          {
            area: Area.Transporte,
            role: Role.Lector,
            permissions: [
              Permission.VIEW_DASHBOARD,
              Permission.VIEW_TICKETS,
              Permission.VIEW_ROUTES,
              Permission.VIEW_FLEET,
            ],
          },
          {
            area: Area.Obras,
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_CIVIL_WORKS],
          },
        ],
      },
    },
  });
  console.log('✅ Lector General creado:', lectorGeneral.username);

  // ============================================
  // 16. INVENTARIO IT (Activos iniciales)
  // ============================================
  console.log('\n💻 Poblando inventario IT...');
  const itAssetsSeed = [
    {
      assetTag: 'IT-NTB-0001',
      serialNumber: 'SN123NTB',
      nombre: 'Dell Latitude 7420',
      categoria: 'Laptop',
      ubicacion: 'Bodega IT',
      proveedor: 'DELL',
      fechaCompra: new Date('2024-01-10T00:00:00Z'),
      garantiaHasta: new Date('2027-01-10T00:00:00Z'),
      notas: 'Equipo de respaldo para nuevas incorporaciones',
    },
    {
      assetTag: 'IT-MON-0001',
      serialNumber: 'SNM123',
      nombre: 'Samsung 24"',
      categoria: 'Monitor',
      ubicacion: 'Bodega IT',
      proveedor: 'Samsung',
    },
    {
      assetTag: 'IT-LIC-0001',
      nombre: 'Licencia Microsoft 365 Business',
      categoria: 'Licencia',
      ubicacion: 'Pool licencias',
      proveedor: 'Microsoft',
      notas: 'Disponible para nuevas cuentas',
    },
  ];

  const prismaIt = prisma as unknown as {
    iTAsset: {
      upsert: (args: any) => Promise<unknown>;
    };
  };

  for (const assetSeed of itAssetsSeed) {
    await prismaIt.iTAsset.upsert({
      where: { assetTag: assetSeed.assetTag },
      update: {},
      create: {
        ...assetSeed,
        estado: 'EN_STOCK',
        movimientos: {
          create: {
            tipo: 'ALTA',
            detalle: 'Alta inicial (seed)',
            usuario: 'seed',
          },
        },
      },
    });
  }
  console.log(`✅ Activos IT iniciales: ${itAssetsSeed.length}`);

  // ============================================
  // MOSTRAR RESUMEN
  // ============================================
  console.log('\n📊 RESUMEN DE USUARIOS CREADOS:');
  console.log('='.repeat(50));

  const usuarios = await prisma.user.findMany({
    include: {
      roleAssignments: {
        where: { isActive: true },
      },
    },
  });

  usuarios.forEach((user, index) => {
    console.log(`\n${index + 1}. 👤 ${user.username} (${user.email})`);
    user.roleAssignments.forEach(assignment => {
      const specialtyText = assignment.specialty ? ` [${assignment.specialty}]` : '';
      console.log(`   📍 ${assignment.area}: ${assignment.role}${specialtyText}`);
      console.log(
        `      Permisos: ${assignment.permissions.slice(0, 2).join(', ')}${assignment.permissions.length > 2 ? '...' : ''} (${assignment.permissions.length} total)`,
      );
    });
  });

  console.log(`\n✅ SEED COMPLETADO: ${usuarios.length} usuarios creados`);
  console.log('🔑 Contraseña para todos: admin123');
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
