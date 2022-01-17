import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString({ each: true })
  @IsNotEmpty()
  paragraphs: string[];
}
