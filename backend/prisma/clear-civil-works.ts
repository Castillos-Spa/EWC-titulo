import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Empezando la limpieza de la tabla CivilWork...');

  try {
    const { count } = await prisma.civilWork.deleteMany({});
    console.log(`✅ Se eliminaron ${count} registros de la tabla CivilWork.`);
    console.log('La tabla ahora está limpia. Puedes volver a crear registros con la nueva estructura.');
  } catch (error) {
    console.error('❌ Ocurrió un error al intentar limpiar la tabla:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos.');
  }
}

main();
