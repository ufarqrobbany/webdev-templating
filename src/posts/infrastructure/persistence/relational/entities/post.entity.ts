import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn, // <-- 1. IMPORT
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne, // <-- 2. IMPORT
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CommentEntity } from '../../../../../comments/infrastructure/persistence/relational/entities/comment.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity'; // <-- 3. IMPORT

@Entity({
  name: 'post',
})
export class PostEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true }) // <-- 4. BUAT JADI NULLABLE
  content: string | null;

  @ManyToOne(() => UserEntity, (user) => user.posts, {
    nullable: false,
  })
  author: UserEntity;

  // ... (relasi likedBy, dll. biarkan saja)
  @ManyToMany(() => UserEntity, (user) => user.likedPosts)
  @JoinTable({ name: 'post_likes_user' })
  likedBy: UserEntity[];

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[];

  // v-- 5. TAMBAHKAN BLOK DI BAWAH INI --v
  @OneToOne(() => FileEntity, {
    eager: true,
    nullable: true, // Postingan boleh tidak punya foto
  })
  @JoinColumn()
  photo?: FileEntity | null;
  // ^-- AKHIR TAMBAHAN --^

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
