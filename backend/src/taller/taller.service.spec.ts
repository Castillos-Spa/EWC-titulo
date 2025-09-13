// taller.service.spec.ts (corregido)
import { Test, TestingModule } from '@nestjs/testing';
import { TallerService } from './taller.service';
import { OrdenTrabajoService } from '../orden-trabajo/orden-trabajo.service';
import { CreateOrdenTrabajoTallerDto } from './dto/create-taller.dto';

const mockOrdenTrabajoService = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockQaService = {
  create: jest.fn(),
};

describe('TallerService', () => {
  let service: TallerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TallerService,
        {
          provide: OrdenTrabajoService,
          useValue: mockOrdenTrabajoService,
        },
        {
          provide: 'IQaService',
          useValue: mockQaService,
        },
      ],
    }).compile();

    service = module.get<TallerService>(TallerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crearOrdenTrabajo', () => {
    it('debería crear una nueva orden de trabajo', async () => {
      const createDto: CreateOrdenTrabajoTallerDto = {
        vehiculoId: 1,
        tipo: 'reparación',
      };

      const expectedResult = {
        id: 1,
        vehiculoId: 1,
        tipo: 'reparación',
        estado: 'abierta',
      };

      mockOrdenTrabajoService.create.mockResolvedValue(expectedResult);

      const result = await service.crearOrdenTrabajo(createDto);

      expect(result).toEqual(expectedResult);
      expect(mockOrdenTrabajoService.create).toHaveBeenCalledWith(createDto);
    });

    it('debería lanzar error si el servicio de orden de trabajo falla', async () => {
      const createDto: CreateOrdenTrabajoTallerDto = {
        vehiculoId: 1,
        tipo: 'reparación',
      };

      mockOrdenTrabajoService.create.mockRejectedValue(new Error('Error de base de datos'));

      await expect(service.crearOrdenTrabajo(createDto)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('cerrarOrdenTrabajo', () => {
    it('debería cerrar una orden de trabajo existente y crear registro QA', async () => {
      const ordenTrabajoMock = {
        id: 1,
        vehiculoId: 1,
        tipo: 'reparación',
        estado: 'abierta',
      };

      const qaResultMock = {
        id: 1,
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      mockOrdenTrabajoService.findOne.mockResolvedValue(ordenTrabajoMock);
      mockOrdenTrabajoService.update.mockResolvedValue({});
      mockQaService.create.mockResolvedValue(qaResultMock);

      const result = await service.cerrarOrdenTrabajo(1, 'Checklist completado', 'Aprobado');

      expect(result).toEqual(qaResultMock);
      expect(mockOrdenTrabajoService.findOne).toHaveBeenCalledWith(1);
      expect(mockOrdenTrabajoService.update).toHaveBeenCalledWith(1, {
        estado: 'Cerrada',
      });
      expect(mockQaService.create).toHaveBeenCalledWith({
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      });
    });

    it('debería lanzar error si la orden de trabajo no existe', async () => {
      mockOrdenTrabajoService.findOne.mockResolvedValue(null);

      await expect(service.cerrarOrdenTrabajo(999, 'Checklist', 'Resultado')).rejects.toThrow(
        'Orden de trabajo con ID 999 no encontrada',
      );

      expect(mockOrdenTrabajoService.findOne).toHaveBeenCalledWith(999);
      expect(mockOrdenTrabajoService.update).not.toHaveBeenCalled();
      expect(mockQaService.create).not.toHaveBeenCalled();
    });

    it('debería lanzar error si falla la actualización de la orden', async () => {
      const ordenTrabajoMock = {
        id: 1,
        vehiculoId: 1,
        tipo: 'reparación',
        estado: 'abierta',
      };

      mockOrdenTrabajoService.findOne.mockResolvedValue(ordenTrabajoMock);
      mockOrdenTrabajoService.update.mockRejectedValue(new Error('Error al actualizar'));

      await expect(service.cerrarOrdenTrabajo(1, 'Checklist', 'Resultado')).rejects.toThrow('Error al actualizar');

      expect(mockQaService.create).not.toHaveBeenCalled();
    });

    it('debería lanzar error si falla la creación del registro QA', async () => {
      const ordenTrabajoMock = {
        id: 1,
        vehiculoId: 1,
        tipo: 'reparación',
        estado: 'abierta',
      };

      mockOrdenTrabajoService.findOne.mockResolvedValue(ordenTrabajoMock);
      mockOrdenTrabajoService.update.mockResolvedValue({});
      mockQaService.create.mockRejectedValue(new Error('Error en QA'));

      await expect(service.cerrarOrdenTrabajo(1, 'Checklist', 'Resultado')).rejects.toThrow('Error en QA');
    });
  });

  // Test para verificar el orden de las operaciones usando call order
  describe('Orden de operaciones', () => {
    it('debería ejecutar las operaciones en el orden correcto', async () => {
      const ordenTrabajoMock = {
        id: 1,
        vehiculoId: 1,
        tipo: 'reparación',
        estado: 'abierta',
      };

      const qaResultMock = {
        id: 1,
        otId: 1,
        checklist: 'Checklist',
        resultado: 'Aprobado',
      };

      mockOrdenTrabajoService.findOne.mockResolvedValue(ordenTrabajoMock);
      mockOrdenTrabajoService.update.mockResolvedValue({});
      mockQaService.create.mockResolvedValue(qaResultMock);

      await service.cerrarOrdenTrabajo(1, 'Checklist', 'Aprobado');

      // Verificar que todas las funciones fueron llamadas
      expect(mockOrdenTrabajoService.findOne).toHaveBeenCalled();
      expect(mockOrdenTrabajoService.update).toHaveBeenCalled();
      expect(mockQaService.create).toHaveBeenCalled();

      // Verificar el orden de llamadas usando el orden de los mocks
      const findOneCallOrder = mockOrdenTrabajoService.findOne.mock.invocationCallOrder[0];
      const updateCallOrder = mockOrdenTrabajoService.update.mock.invocationCallOrder[0];
      const createCallOrder = mockQaService.create.mock.invocationCallOrder[0];

      expect(findOneCallOrder).toBeLessThan(updateCallOrder);
      expect(updateCallOrder).toBeLessThan(createCallOrder);
    });
  });

  // Test para verificar que no se crea QA si la orden no existe
  describe('Flujo de errores', () => {
    it('no debería llamar a update ni create si findOne retorna null', async () => {
      mockOrdenTrabajoService.findOne.mockResolvedValue(null);

      try {
        await service.cerrarOrdenTrabajo(999, 'Checklist', 'Resultado');
        fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error.message).toBe('Orden de trabajo con ID 999 no encontrada');
      }

      expect(mockOrdenTrabajoService.update).not.toHaveBeenCalled();
      expect(mockQaService.create).not.toHaveBeenCalled();
    });
  });
});
