import { PartialType } from '@nestjs/mapped-types';
import { CreateQADto } from './create-qa.dto';

export class UpdateQaDto extends PartialType(CreateQADto) {}
