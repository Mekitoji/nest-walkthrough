import { PostSearchBody } from './postSearchBody.interface';

export interface PostSearchResult {
  total: number;
  hits: Array<{
    _source: PostSearchBody;
  }>;
}
