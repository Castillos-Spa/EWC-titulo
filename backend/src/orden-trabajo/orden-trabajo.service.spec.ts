// orden-trabajo.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';

const mockPrismaService = {
  ordenTrabajo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  qA: {
    create: jest.fn(),
  },
};

describe('OrdenTrabajoService', () => {
  let service: OrdenTrabajoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdenTrabajoService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<OrdenTrabajoService>(OrdenTrabajoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una nueva orden de trabajo con estado "abierta"', async () => {
      const createDto: CreateOrdenTrabajoDto = {
        vehiculoId: 1,
        tipo: 'mantenimiento',
      };

      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'abierta',
        tareas: [],
        responsableId: null,
      };

      mockPrismaService.ordenTrabajo.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.create).toHaveBeenCalledWith({
        data: {
          vehiculoId: 1,
          tipo: 'mantenimiento',
          estado: 'abierta',
        },
      });
    });

    it('debería lanzar error si Prisma falla', async () => {
      const createDto: CreateOrdenTrabajoDto = {
        vehiculoId: 1,
        tipo: 'mantenimiento',
      };

      mockPrismaService.ordenTrabajo.create.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.create(createDto)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las órdenes de trabajo con relaciones', async () => {
      const expectedResult = [
        {
          id: 1,
          vehiculoId: 1,
          tipo: 'mantenimiento',
          estado: 'abierta',
          vehiculo: { id: 1, modelo: 'Toyota' },
          qa: null,
        },
      ];

      mockPrismaService.ordenTrabajo.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.findMany).toHaveBeenCalledWith({
        include: { vehiculo: true, qa: true },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar una orden de trabajo por ID', async () => {
      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'abierta',
        vehiculo: { id: 1, modelo: 'Toyota' },
        qa: null,
      };

      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { vehiculo: true, qa: true },
      });
    });

    it('debería retornar null si la orden no existe', async () => {
      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar una orden de trabajo existente', async () => {
      const updateDto: UpdateOrdenTrabajoDto = {
        estado: 'en_proceso',
      };

      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'en_proceso',
      };

      mockPrismaService.ordenTrabajo.update.mockResolvedValue(expectedResult);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });
  });

  describe('planificarTareas', () => {
    it('debería actualizar las tareas de una orden de trabajo', async () => {
      const tareas = ['Cambio de aceite', 'Revisión de frenos', 'Alineación'];
      const expectedResult = {
        id: 1,
        tareas,
      };

      mockPrismaService.ordenTrabajo.update.mockResolvedValue(expectedResult);

      const result = await service.planificarTareas(1, tareas);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tareas },
      });
    });
  });

  describe('asignarResponsable', () => {
    it('debería asignar un responsable a la orden de trabajo', async () => {
      const responsableId = 5;
      const expectedResult = {
        id: 1,
        responsableId: 5,
      };

      mockPrismaService.ordenTrabajo.update.mockResolvedValue(expectedResult);

      const result = await service.asignarResponsable(1, responsableId);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { responsableId },
      });
    });
  });

  describe('cerrarOT', () => {
    it('debería cerrar la OT y crear registro en QA', async () => {
      const ordenTrabajoMock = {
        id: 1,
        estado: 'abierta',
      };

      const qaResultMock = {
        id: 1,
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(ordenTrabajoMock);
      mockPrismaService.ordenTrabajo.update.mockResolvedValue({});
      mockPrismaService.qA.create.mockResolvedValue(qaResultMock);

      const result = await service.cerrarOT(1, 'Checklist completado', 'Aprobado');

      expect(result).toEqual(qaResultMock);
      expect(mockPrismaService.ordenTrabajo.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.ordenTrabajo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'Cerrada' },
      });
      expect(mockPrismaService.qA.create).toHaveBeenCalledWith({
        data: {
          otId: 1,
          checklist: 'Checklist completado',
          resultado: 'Aprobado',
        },
      });
    });

    it('debería lanzar error si la orden de trabajo no existe', async () => {
      mockPrismaService.ordenTrabajo.findUnique.mockResolvedValue(null);

      await expect(service.cerrarOT(999, 'Checklist', 'Resultado')).rejects.toThrow(
        'Orden de trabajo con ID 999 no encontrada',
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar una orden de trabajo', async () => {
      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'abierta',
      };

      mockPrismaService.ordenTrabajo.delete.mockResolvedValue(expectedResult);

      const result = await service.remove(1);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.ordenTrabajo.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
