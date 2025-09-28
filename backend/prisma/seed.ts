// prisma/seed.ts
import { PrismaClient, Role, Permission, Specialty } from '@prisma/client';
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
          area: 'IT',
          role: Role.Admin,
          permissions: Object.values(Permission), // Admin tiene todos los permisos
        },
      },
    },
  });
  console.log('✅ Admin creado:', admin.username);

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
          area: 'IT',
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
          area: 'Transporte',
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
          area: 'Transporte',
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
          area: 'Transporte',
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
            area: 'Obras',
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
            area: 'P_Riesgo',
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_RISK_ASSESSMENTS],
          },
        ],
      },
    },
  });
  console.log('✅ Jefe Obras creado:', jefeObras.username);

  // ============================================
  // 7. INGENIERO CIVIL (Especialista en Obras)
  // ============================================
  const ingeniero = await prisma.user.upsert({
    where: { email: 'ingeniero@empresa.cl' },
    update: {},
    create: {
      username: 'ing.civil',
      email: 'ingeniero@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'Obras',
          role: Role.Especialista,
          specialty: Specialty.CIVIL_ENGINEER,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_CIVIL_WORKS,
            Permission.MANAGE_CIVIL_WORKS,
          ],
        },
      },
    },
  });
  console.log('✅ Ingeniero Civil creado:', ingeniero.username);

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
          area: 'Aseo',
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
  // 9. COORDINADOR DE LIMPIEZA (Especialista)
  // ============================================
  const coordinadorLimpieza = await prisma.user.upsert({
    where: { email: 'coordinador.limpieza@empresa.cl' },
    update: {},
    create: {
      username: 'coord.limpieza',
      email: 'coordinador.limpieza@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'Aseo',
          role: Role.Especialista,
          specialty: Specialty.CLEANING_COORDINATOR,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_CLEANING_REPORTS,
            Permission.MANAGE_CLEANING_REPORTS,
          ],
        },
      },
    },
  });
  console.log('✅ Coordinador Limpieza creado:', coordinadorLimpieza.username);

  // ============================================
  // 10. ESPECIALISTA EN RRHH
  // ============================================
  const especialistaRRHH = await prisma.user.upsert({
    where: { email: 'rrhh@empresa.cl' },
    update: {},
    create: {
      username: 'esp.rrhh',
      email: 'rrhh@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'RRHH',
          role: Role.Especialista,
          specialty: Specialty.HR_SPECIALIST,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_EMPLOYEES,
            Permission.MANAGE_EMPLOYEES,
          ],
        },
      },
    },
  });
  console.log('✅ Especialista RRHH creado:', especialistaRRHH.username);

  // ============================================
  // 11. CONTADOR (Especialista en Finanzas)
  // ============================================
  const contador = await prisma.user.upsert({
    where: { email: 'contador@empresa.cl' },
    update: {},
    create: {
      username: 'contador',
      email: 'contador@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'Finanza',
          role: Role.Especialista,
          specialty: Specialty.ACCOUNTANT,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_FINANCIAL_REPORTS,
            Permission.MANAGE_BUDGETS,
          ],
        },
      },
    },
  });
  console.log('✅ Contador creado:', contador.username);

  // ============================================
  // 12. INSPECTOR DE SEGURIDAD (Especialista P_Riesgo)
  // ============================================
  const inspectorSeguridad = await prisma.user.upsert({
    where: { email: 'inspector.seguridad@empresa.cl' },
    update: {},
    create: {
      username: 'inspector.seguridad',
      email: 'inspector.seguridad@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'P_Riesgo',
          role: Role.Especialista,
          specialty: Specialty.SAFETY_INSPECTOR,
          permissions: [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TICKETS,
            Permission.VIEW_RISK_ASSESSMENTS,
            Permission.MANAGE_RISK_ASSESSMENTS,
            Permission.CREATE_SAFETY_PROTOCOLS,
          ],
        },
      },
    },
  });
  console.log('✅ Inspector Seguridad creado:', inspectorSeguridad.username);

  // ============================================
  // 13. SOPORTE IT (Especialista)
  // ============================================
  const soporteIT = await prisma.user.upsert({
    where: { email: 'soporte.it@empresa.cl' },
    update: {},
    create: {
      username: 'soporte.it',
      email: 'soporte.it@empresa.cl',
      password: defaultPassword,
      roleAssignments: {
        create: {
          area: 'IT',
          role: Role.Especialista,
          specialty: Specialty.IT_SUPPORT,
          permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.MANAGE_TICKETS],
        },
      },
    },
  });
  console.log('✅ Soporte IT creado:', soporteIT.username);

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
            area: 'Obras',
            role: Role.Trabajador,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_CIVIL_WORKS],
          },
          {
            area: 'Aseo',
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
            area: 'IT',
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS],
          },
          {
            area: 'Transporte',
            role: Role.Lector,
            permissions: [
              Permission.VIEW_DASHBOARD,
              Permission.VIEW_TICKETS,
              Permission.VIEW_ROUTES,
              Permission.VIEW_FLEET,
            ],
          },
          {
            area: 'Obras',
            role: Role.Lector,
            permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_TICKETS, Permission.VIEW_CIVIL_WORKS],
          },
        ],
      },
    },
  });
  console.log('✅ Lector General creado:', lectorGeneral.username);

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
