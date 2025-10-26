import { Post } from '../../../../domain/post';
import { PostEntity } from '../entities/post.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

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

    return domainEntity;
  }

  static toPersistence(domainEntity: Post): PostEntity {
    const persistenceEntity = new PostEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.content = domainEntity.content;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    if (domainEntity.author) {
      persistenceEntity.author = UserMapper.toPersistence(
        domainEntity.author,
      ) as UserEntity;
    }

    return persistenceEntity;
  }
}
