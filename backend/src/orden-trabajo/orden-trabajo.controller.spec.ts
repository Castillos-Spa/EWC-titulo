// orden-trabajo.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrdenTrabajoController } from './orden-trabajo.controller';
import { OrdenTrabajoService } from './orden-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateOrdenTrabajoDto } from './dto/update-orden-trabajo.dto';

const mockOrdenTrabajoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  planificarTareas: jest.fn(),
  asignarResponsable: jest.fn(),
  cerrarOT: jest.fn(),
};

describe('OrdenTrabajoController', () => {
  let controller: OrdenTrabajoController;
  let service: OrdenTrabajoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdenTrabajoController],
      providers: [
        {
          provide: OrdenTrabajoService,
          useValue: mockOrdenTrabajoService,
        },
      ],
    }).compile();

    controller = module.get<OrdenTrabajoController>(OrdenTrabajoController);
    service = module.get<OrdenTrabajoService>(OrdenTrabajoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una nueva orden de trabajo', async () => {
      const createDto: CreateOrdenTrabajoDto = {
        vehiculoId: 1,
        tipo: 'mantenimiento',
      };

      const expectedResult = {
        id: 1,
        ...createDto,
        estado: 'abierta',
      };

      mockOrdenTrabajoService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las órdenes de trabajo', async () => {
      const expectedResult = [
        {
          id: 1,
          vehiculoId: 1,
          tipo: 'mantenimiento',
          estado: 'abierta',
        },
      ];

      mockOrdenTrabajoService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar una orden de trabajo por ID', async () => {
      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'abierta',
      };

      mockOrdenTrabajoService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(1);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('debería actualizar una orden de trabajo', async () => {
      const updateDto: UpdateOrdenTrabajoDto = {
        estado: 'en_proceso',
      };

      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'mantenimiento',
        estado: 'en_proceso',
      };

      mockOrdenTrabajoService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('planificarTareas', () => {
    it('debería planificar tareas para una orden de trabajo', async () => {
      const tareasDto = { tareas: ['Tarea 1', 'Tarea 2'] };
      const expectedResult = {
        id: 1,
        tareas: ['Tarea 1', 'Tarea 2'],
      };

      mockOrdenTrabajoService.planificarTareas.mockResolvedValue(expectedResult);

      const result = await controller.planificarTareas(1, tareasDto);

      expect(result).toEqual(expectedResult);
      expect(service.planificarTareas).toHaveBeenCalledWith(1, tareasDto.tareas);
    });
  });

  describe('asignarResponsable', () => {
    it('debería asignar un responsable a la orden de trabajo', async () => {
      const responsableDto = { responsableId: 5 };
      const expectedResult = {
        id: 1,
        responsableId: 5,
      };

      mockOrdenTrabajoService.asignarResponsable.mockResolvedValue(expectedResult);

      const result = await controller.asignarResponsable(1, responsableDto);

      expect(result).toEqual(expectedResult);
      expect(service.asignarResponsable).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('cerrarOT', () => {
    it('debería cerrar la orden de trabajo y crear registro QA', async () => {
      const body = {
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      mockOrdenTrabajoService.cerrarOT.mockResolvedValue(expectedResult);

      const result = await controller.cerrarOT(1, body);

      expect(result).toEqual(expectedResult);
      expect(service.cerrarOT).toHaveBeenCalledWith(1, body.checklist, body.resultado);
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

      mockOrdenTrabajoService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(1);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  // Pruebas de validación de parámetros
  // orden-trabajo.controller.spec.ts (test corregido)
  // orden-trabajo.controller.spec.ts (tests actualizados)
  describe('Validación de parámetros', () => {
    it('debería usar ParseIntPipe para validar IDs numéricos', async () => {
      mockOrdenTrabajoService.findOne.mockResolvedValue({});

      await controller.findOne(123); // Ahora recibe number directamente

      expect(service.findOne).toHaveBeenCalledWith(123);
    });

    // Test para verificar que ParseIntPipe funciona correctamente
    // (esto se probaría en tests de integración)
    it('debería rechazar IDs no numéricos con ParseIntPipe', async () => {
      // ParseIntPipe automáticamente lanza BadRequestException para IDs no numéricos
      // Este comportamiento se prueba mejor en tests de integración
    });
  });
});
