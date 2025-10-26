import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PostEntity } from '../../../../../posts/infrastructure/persistence/relational/entities/post.entity';

@Entity({
  name: 'comment',
})
export class CommentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  author: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.comments, { nullable: false })
  post: PostEntity;

  @ManyToOne(() => CommentEntity, (comment) => comment.replies, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  replies: CommentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
