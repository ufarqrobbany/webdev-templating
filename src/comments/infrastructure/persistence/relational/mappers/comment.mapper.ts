import { Comment } from '../../../../domain/comment';
import { CommentEntity } from '../entities/comment.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper'; // <-- ADD
import { PostMapper } from '../../../../../posts/infrastructure/persistence/relational/mappers/post.mapper'; // <-- ADD
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity'; // <-- ADD
import { PostEntity } from '../../../../../posts/infrastructure/persistence/relational/entities/post.entity'; // <-- ADD

export class CommentMapper {
  static toDomain(raw: CommentEntity): Comment {
    const domainEntity = new Comment();
    domainEntity.id = raw.id;
    domainEntity.content = raw.content; // <-- ADD
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt; // <-- ADD

    // v-- ADD mappers for relations --v
    if (raw.author) {
      domainEntity.author = UserMapper.toDomain(raw.author);
    }
    if (raw.post) {
      domainEntity.post = PostMapper.toDomain(raw.post);
    }
    if (raw.parent) {
      domainEntity.parent = CommentMapper.toDomain(raw.parent);
    }
    if (raw.replies) {
      domainEntity.replies = raw.replies.map(CommentMapper.toDomain);
    }
    // ^-- ADD --^

    return domainEntity;
  }

  static toPersistence(domainEntity: Comment): CommentEntity {
    const persistenceEntity = new CommentEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.content = domainEntity.content; // <-- ADD
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt ?? null; // <-- ADD

    // v-- ADD mappers for relations --v
    if (domainEntity.author) {
      persistenceEntity.author = UserMapper.toPersistence(
        domainEntity.author,
      ) as UserEntity;
    }
    // For create/update, we only need to link the ID for post/parent
    if (domainEntity.post) {
      persistenceEntity.post = { id: domainEntity.post.id } as PostEntity;
    }
    if (domainEntity.parent) {
      persistenceEntity.parent = {
        id: domainEntity.parent.id,
      } as CommentEntity;
    }
    // We don't map replies back to persistence, as they are managed by the children
    // ^-- ADD --^

    return persistenceEntity;
  }
}
