import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { CategoryNotFoundException } from './exceptions/categoryNotFound.exception';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  public async createCategory(category: CreateCategoryDto): Promise<Category> {
    const newCategory = this.categoryRepository.create(category);
    await this.categoryRepository.save(newCategory);
    return newCategory;
  }

  public async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({ relations: ['posts'] });
  }

  public async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (category) {
      return category;
    }

    throw new CategoryNotFoundException(id);
  }

  public async updateCategory(
    id: number,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    await this.categoryRepository.update(id, category);
    const updatedCategory = await this.categoryRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (updatedCategory) {
      return updatedCategory;
    }

    throw new CategoryNotFoundException(id);
  }

  public async deleteCategory(id: number) {
    const deleteResponse = await this.categoryRepository.delete(id);

    if (!deleteResponse.affected) {
      throw new CategoryNotFoundException(id);
    }
  }
}
