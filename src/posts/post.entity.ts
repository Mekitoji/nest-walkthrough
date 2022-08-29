import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinTable,
  ManyToMany,
  Index,
  OneToMany,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Comment } from '../comments/comment.entity';
import { User } from '../users/user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public title: string;

  @Column('text', { array: true })
  public paragraphs: string[];

  @Column({ nullable: true })
  public category?: string;

  @Index('post_authorId_index')
  @ManyToOne(() => User, (author: User) => author.posts)
  public author?: User;

  @ManyToMany(() => Category)
  @JoinTable()
  public categories: Category[];

  @OneToMany(() => Comment, (comment: Comment) => comment.post)
  public comments: Comment[];
}
