import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetCommentDto {
  @Type(() => Number)
  @IsOptional()
  postId: number;
}
