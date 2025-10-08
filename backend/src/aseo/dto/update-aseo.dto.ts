import { PartialType } from '@nestjs/mapped-types';
import { CreateAseoDto } from './create-aseo.dto';

export class UpdateAseoDto extends PartialType(CreateAseoDto) {}
