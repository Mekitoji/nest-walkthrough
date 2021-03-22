import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType } from '../utils/mocks/mockType';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { CategoryNotFoundException } from './exceptions/categoryNotFound.exception';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockedCategoryRepository: MockType<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    mockedCategoryRepository = module.get(getRepositoryToken(Category));
    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('when creating new category', () => {
    let category: Category;
    let createCategoryDto: CreateCategoryDto;
    beforeEach(() => {
      category = new Category();
      createCategoryDto = {
        name: 'new category',
      };
    });
    it('expect to return a new category', async () => {
      const saveSpy = jest
        .spyOn(mockedCategoryRepository, 'save')
        .mockResolvedValue(undefined);
      const createSpy = jest
        .spyOn(mockedCategoryRepository, 'create')
        .mockReturnValue(category);
      await expect(service.createCategory(createCategoryDto)).resolves.toEqual(
        category,
      );
      expect(saveSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
    });
  });
  describe('when get all categories', () => {
    let category: Category;
    beforeEach(() => {
      category = new Category();
    });
    it('expect to return array of categories', async () => {
      const expected = [category];
      const spy = jest
        .spyOn(mockedCategoryRepository, 'find')
        .mockResolvedValue(expected);

      await expect(service.getAllCategories()).resolves.toEqual(expected);

      expect(spy).toHaveBeenCalled();
    });
  });
  describe('when get by id', () => {
    let category: Category;
    beforeEach(() => {
      category = new Category();
    });
    it('expect to return category if is exist', async () => {
      const id = 1;
      const spy = jest
        .spyOn(mockedCategoryRepository, 'findOne')
        .mockResolvedValue(category);
      await expect(service.getCategoryById(id)).resolves.toEqual(category);

      expect(spy).toHaveBeenCalled();
    });
    it('expect to throw an error if category does not exist', async () => {
      const id = 343;
      const spy = jest
        .spyOn(mockedCategoryRepository, 'findOne')
        .mockResolvedValue(null);
      await expect(service.getCategoryById(id)).rejects.toThrowError(
        new CategoryNotFoundException(id),
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when update a category', () => {
    let category: Category;
    let newCategory: Category;
    const id = 1;
    beforeEach(() => {
      category = new Category();
      category.name = 'name';
      newCategory = new Category();
      newCategory.name = 'new name';
    });
    it('expect return a updated category', async () => {
      const spyUpdate = jest
        .spyOn(mockedCategoryRepository, 'update')
        .mockResolvedValue(undefined);

      const spyFindOne = jest
        .spyOn(mockedCategoryRepository, 'findOne')
        .mockResolvedValue(newCategory);

      await expect(service.updateCategory(id, category)).resolves.toEqual(
        newCategory,
      );

      expect(spyUpdate).toHaveBeenCalled();
      expect(spyFindOne).toHaveBeenCalled();
    });

    it('expect to throw an error if category not found', async () => {
      const spyUpdate = jest
        .spyOn(mockedCategoryRepository, 'update')
        .mockResolvedValue(undefined);

      const spyFindOne = jest
        .spyOn(mockedCategoryRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(service.updateCategory(id, category)).rejects.toThrowError(
        new CategoryNotFoundException(id),
      );

      expect(spyUpdate).toHaveBeenCalled();
      expect(spyFindOne).toHaveBeenCalled();
    });
  });

  describe('when deleting category', () => {
    it('expect to resolve', async () => {
      const id = 1;
      const spy = jest
        .spyOn(mockedCategoryRepository, 'delete')
        .mockResolvedValue({ affected: true });
      await expect(service.deleteCategory(id)).resolves.toEqual(undefined);

      expect(spy).toHaveBeenCalled();
    });
    it('expect to throw an error, if category does not exist', async () => {
      const id = 322;
      const spy = jest
        .spyOn(mockedCategoryRepository, 'delete')
        .mockResolvedValue({ affected: false });
      await expect(service.deleteCategory(id)).rejects.toThrowError(
        new CategoryNotFoundException(id),
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
