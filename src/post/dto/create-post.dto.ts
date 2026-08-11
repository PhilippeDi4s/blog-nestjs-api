import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'Título precisa ser uma string' })
  @Length(10, 150, { message: 'Título precisa ter entre 10 e 150 caracteres' })
  title: string;

  @IsString({ message: 'Excerto precisa ser uma string' })
  @Length(10, 200, { message: 'Excerto precisa ter entre 10 e 200 caracteres' })
  excerpt: string;

  @IsString({ message: 'Conteúdo precisa ser uma string' })
  @IsNotEmpty({ message: 'Conteúdo não pode ficar vazio' })
  content: string;

  @IsUrl(
    { require_tld: false },
    { message: 'URL da imagem precisa ser uma URL vàlida' },
  )
  coverImage: string;

  @IsOptional()
  @IsBoolean({ message: 'Campo de publicar post precisa ser boolean' })
  published?: boolean;
}
