import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminActionReasonDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(250)
  reason: string;
}
