// qa.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { CreateQADto } from './dto/create-qa.dto';

const mockQaService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  bloquearLiberacion: jest.fn(),
  remove: jest.fn(),
};

describe('QaController', () => {
  let controller: QaController;
  let service: QaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QaController],
      providers: [
        {
          provide: QaService,
          useValue: mockQaService,
        },
      ],
    }).compile();

    controller = module.get<QaController>(QaController);
    service = module.get<QaService>(QaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un nuevo registro QA', async () => {
      const createDto: CreateQADto = {
        otId: 1,
        checklist: 'Checklist completado',
        resultado: 'Aprobado',
      };

      const expectedResult = {
        id: 1,
        ...createDto,
      };

      mockQaService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los registros QA', async () => {
      const expectedResult = [
        {
          id: 1,
          otId: 1,
          checklist: 'Checklist 1',
          resultado: 'Aprobado',
        },
      ];

      mockQaService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un registro QA por ID', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist 1',
        resultado: 'Aprobado',
      };

      mockQaService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(1);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('bloquearLiberacion', () => {
    it('debería bloquear la liberación de un vehículo', async () => {
      const expectedResult = {
        id: 1,
        estado: 'bloqueada',
      };

      mockQaService.bloquearLiberacion.mockResolvedValue(expectedResult);

      const result = await controller.bloquearLiberacion(1);

      expect(result).toEqual(expectedResult);
      expect(service.bloquearLiberacion).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('debería eliminar un registro QA', async () => {
      const expectedResult = {
        id: 1,
        otId: 1,
        checklist: 'Checklist 1',
        resultado: 'Aprobado',
      };

      mockQaService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(1);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
