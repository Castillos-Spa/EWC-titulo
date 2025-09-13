// taller.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TallerController } from './taller.controller';
import { TallerService } from './taller.service';
import { CreateOrdenTrabajoTallerDto } from './dto/create-taller.dto';

const mockTallerService = {
  crearOrdenTrabajo: jest.fn(),
  cerrarOrdenTrabajo: jest.fn(),
};

describe('TallerController', () => {
  let controller: TallerController;
  let service: TallerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TallerController],
      providers: [
        {
          provide: TallerService,
          useValue: mockTallerService,
        },
      ],
    }).compile();

    controller = module.get<TallerController>(TallerController);
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

      mockTallerService.crearOrdenTrabajo.mockResolvedValue(expectedResult);

      const result = await controller.crearOrdenTrabajo(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.crearOrdenTrabajo).toHaveBeenCalledWith(createDto);
    });

    it('debería lanzar error si el servicio falla', async () => {
      const createDto: CreateOrdenTrabajoTallerDto = {
        vehiculoId: 1,
        tipo: 'reparación',
      };

      mockTallerService.crearOrdenTrabajo.mockRejectedValue(new Error('Error del servicio'));

      await expect(controller.crearOrdenTrabajo(createDto)).rejects.toThrow('Error del servicio');
    });
  });

  describe('cerrarOrdenTrabajo', () => {
    it('debería cerrar una orden de trabajo', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      mockTallerService.cerrarOrdenTrabajo.mockResolvedValue(expectedResult);

      const result = await controller.cerrarOrdenTrabajo(1, 'Checklist completado', 'Aprobado');

      expect(result).toEqual(expectedResult);
      expect(service.cerrarOrdenTrabajo).toHaveBeenCalledWith(1, 'Checklist completado', 'Aprobado');
    });

    it('debería manejar parámetros correctamente', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist',
        resultado: 'Resultado',
      };

      mockTallerService.cerrarOrdenTrabajo.mockResolvedValue(expectedResult);

      const result = await controller.cerrarOrdenTrabajo(123, 'Checklist', 'Resultado');

      expect(result).toEqual(expectedResult);
      expect(service.cerrarOrdenTrabajo).toHaveBeenCalledWith(123, 'Checklist', 'Resultado');
    });

    it('debería lanzar error si el servicio falla', async () => {
      mockTallerService.cerrarOrdenTrabajo.mockRejectedValue(new Error('Error del servicio'));

      await expect(controller.cerrarOrdenTrabajo(1, 'Checklist', 'Resultado')).rejects.toThrow('Error del servicio');
    });
  });

  // Test para verificar la estructura del controller
  describe('Estructura del controller', () => {
    it('debería tener los métodos correctos', () => {
      expect(controller.crearOrdenTrabajo).toBeDefined();
      expect(controller.cerrarOrdenTrabajo).toBeDefined();
    });
  });
});
