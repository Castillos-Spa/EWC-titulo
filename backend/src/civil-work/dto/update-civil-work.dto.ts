import { PartialType } from '@nestjs/mapped-types';
import { CreateCivilWorkDto } from './create-civil-work.dto';

export class UpdateCivilWorkDto extends PartialType(CreateCivilWorkDto) {}
