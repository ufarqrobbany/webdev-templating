import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CommentEntity } from '../../../../../comments/infrastructure/persistence/relational/entities/comment.entity';

@Entity({
  name: 'post',
})
export class PostEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => UserEntity, (user) => user.posts, {
    nullable: false,
  })
  author: UserEntity;

  // (Di dalam class PostEntity)
  @ManyToMany(() => UserEntity, (user) => user.likedPosts)
  @JoinTable({ name: 'post_likes_user' }) // Nama tabel penghubung
  likedBy: UserEntity[];

  @Column({ type: 'int', default: 0 })
  likesCount: number; // Counter cache

  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[]; // <-- TAMBAHKAN BARIS INI

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
