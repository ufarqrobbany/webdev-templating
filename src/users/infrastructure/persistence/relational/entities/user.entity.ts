import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToMany, // Baru
  JoinTable, // Baru
  OneToMany, // Baru
} from 'typeorm';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { AuthProvidersEnum } from '../../../../../auth/auth-providers.enum';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PostEntity } from '../../../../../posts/infrastructure/persistence/relational/entities/post.entity'; // Baru

@Entity({
  name: 'user',
})
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  // For "string | null" we need to use String type.
  // More info: https://github.com/typeorm/typeorm/issues/2567
  @Column({ type: String, unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Index()
  @Column({ type: String, nullable: true })
  socialId?: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  lastName: string | null;

  @Column({ type: String, nullable: true })
  bio?: string | null;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn()
  photo?: FileEntity | null;

  @ManyToOne(() => RoleEntity, {
    eager: true,
  })
  @JoinColumn()
  role?: RoleEntity | null;

  @ManyToOne(() => StatusEntity, {
    eager: true,
  })
  @JoinColumn()
  status?: StatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Baru
  @OneToMany(() => PostEntity, (post) => post.author)
  posts: PostEntity[];

  // Baru
  @ManyToMany(() => UserEntity, (user) => user.followers)
  @JoinTable()
  following: UserEntity[];

  // Baru
  @ManyToMany(() => UserEntity, (user) => user.following)
  followers: UserEntity[];

  @ManyToMany(() => PostEntity, (post) => post.likedBy)
  likedPosts: PostEntity[];
}
