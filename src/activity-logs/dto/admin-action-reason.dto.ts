import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminActionReasonDto {
  @IsString({ message: 'O motivo deve ser uma string' })
  @IsNotEmpty({ message: 'O motivo não pode estar vazio' })
  @MinLength(10, { message: 'O motivo deve conter no mínimo 10 caracteres' })
  @MaxLength(250, { message: 'O motivo deve conter no máximo 250 caracteres' })
  reason: string;
}
