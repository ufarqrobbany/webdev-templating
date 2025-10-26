import { Post } from '../../../../domain/post';
import { PostEntity } from '../entities/post.entity';

export class PostMapper {
  static toDomain(raw: PostEntity): Post {
    const domainEntity = new Post();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Post): PostEntity {
    const persistenceEntity = new PostEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
