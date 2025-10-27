import { Post } from '../../../../domain/post';
import { PostEntity } from '../entities/post.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper'; // <-- 1. IMPORT
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity'; // <-- 2. IMPORT

export class PostMapper {
  static toDomain(raw: PostEntity): Post {
    const domainEntity = new Post();
    domainEntity.id = raw.id;
    domainEntity.content = raw.content;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    if (raw.author) {
      domainEntity.author = UserMapper.toDomain(raw.author);
    }

    // v-- 3. TAMBAHKAN BLOK INI --v
    if (raw.photo) {
      domainEntity.photo = FileMapper.toDomain(raw.photo);
    }
    // ^-- AKHIR TAMBAHAN --^

    return domainEntity;
  }

  static toPersistence(domainEntity: Post): PostEntity {
    const persistenceEntity = new PostEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    // v-- PERBAIKAN DI SINI --v
    // Pastikan kita menyimpan null jika content undefined atau null
    persistenceEntity.content = domainEntity.content ?? null;
    // ^-- AKHIR PERBAIKAN --^
    
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    if (domainEntity.author) {
      persistenceEntity.author = UserMapper.toPersistence(
        domainEntity.author,
      ) as UserEntity;
    }

    let photo: FileEntity | undefined | null = undefined;
    if (domainEntity.photo) {
      photo = new FileEntity();
      photo.id = domainEntity.photo.id;
      photo.path = domainEntity.photo.path;
    } else { // <-- Pastikan photo di-set ke null jika tidak ada
      photo = null;
    }
    persistenceEntity.photo = photo;

    return persistenceEntity;
  }
}
