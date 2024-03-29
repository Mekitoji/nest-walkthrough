import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @IsNumber()
  id: number;

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  paragraphs: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title: string;
}
