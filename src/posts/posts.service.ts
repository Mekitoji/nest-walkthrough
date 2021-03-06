import { Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { In, Repository } from 'typeorm';
import { Post } from './post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostNotFoundException } from './exception/postNotFound.exception';
import { User } from '../users/user.entity';
import { PostSearchService } from './postsSearch.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private postSearchService: PostSearchService
  ) {}

  async getAllPosts(): Promise<Post[]> {
    return this.postRepository.find();
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne(id);

    if (post) {
      return post;
    }

    throw new PostNotFoundException(id);
  }

  public async replacePost(id: number, post: UpdatePostDto): Promise<Post> {
    await this.postRepository.update(id, post);
    const updatedPost = await this.postRepository.findOne(id);
    if (updatedPost) {
      await this.postSearchService.update(updatedPost);
      return updatedPost;
    }

    throw new PostNotFoundException(id);
  }

  public async createPost(post: CreatePostDto, user: User): Promise<Post> {
    const newPost = this.postRepository.create({
      ...post,
      author: user,
    });

    await this.postRepository.save(newPost);
    await this.postSearchService.indexPost(newPost);

    return newPost;
  }

  public async deletePost(id: number): Promise<void> {
    const deleteResponse = await this.postRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new PostNotFoundException(id);
    }
    await this.postSearchService.remove(id);
  }

  public async searchForPosts(text: string): Promise<Post[]> {
    const results = await this.postSearchService.search(text);
    const ids = results.map((result) => result.id);
    if (!ids.length) {
      return [];
    }

    return this.postRepository.find({
      where: { id: In(ids) },
    });
  }
}
