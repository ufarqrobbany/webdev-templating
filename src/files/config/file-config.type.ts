export enum FileDriver {
  LOCAL = 'local',
  S3 = 's3',
  S3_PRESIGNED = 's3-presigned',
}

export type FileConfig = {
  driver: FileDriver;
  accessKeyId?: string;
  secretAccessKey?: string;
  awsDefaultS3Bucket?: string;
  awsS3Region?: string;
  maxFileSize: number;
  // --- BARU: Tambahan Properti Cloudflare R2 ---
  awsS3PublicUrl?: string; // URL CDN Publik untuk link database
  awsS3Endpoint?: string;  // Endpoint API R2 (cth: ...r2.cloudflarestorage.com)
  // ----------------------------------------
};