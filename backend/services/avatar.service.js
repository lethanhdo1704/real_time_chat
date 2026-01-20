// backend/services/avatar.service.js
import sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

class AvatarService {
  constructor() {
    this.r2Enabled = process.env.R2_ENABLED === 'true';
    
    if (this.r2Enabled) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      this.bucketName = process.env.R2_BUCKET;
      this.publicUrl = process.env.R2_PUBLIC_URL;
      console.log("✅ R2 Storage enabled for avatars");
    } else {
      console.warn("⚠️  R2 Storage disabled - avatars will not be saved");
    }
  }

  /**
   * Process and save avatar to R2
   * - Sharp validates image (throws if invalid)
   * - Resize 256x256
   * - Strip metadata
   * - Convert WebP
   * - Upload to R2 as avatars/<uid>.webp
   */
  async processAndSave(buffer, uid) {
    try {
      if (!this.r2Enabled) {
        throw new Error("R2 storage is not enabled");
      }

      const filename = `${uid}.webp`;
      const key = `avatars/${filename}`;

      // Process image with Sharp
      const processedBuffer = await sharp(buffer)
        .resize(256, 256, {
          fit: "cover",
          position: "center"
        })
        .webp({ 
          quality: 85,
          effort: 6
        })
        .toBuffer();

      // Upload to R2
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: processedBuffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000", // 1 year cache
        })
      );

      console.log(`✅ [Avatar] Saved to R2: ${key}`);

      // Return public URL
      return `${this.publicUrl}/${key}`;
    } catch (error) {
      console.error("❌ [Avatar] Processing error:", error);
      
      if (error.message.includes("Input buffer") || error.message.includes("Input file")) {
        throw new Error("Invalid image file");
      }
      
      throw new Error("Failed to process avatar");
    }
  }

  /**
   * Delete avatar from R2
   */
  async delete(uid) {
    try {
      if (!this.r2Enabled) {
        console.warn("⚠️  R2 storage disabled - cannot delete");
        return false;
      }

      const filename = `${uid}.webp`;
      const key = `avatars/${filename}`;
      
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      console.log(`✅ [Avatar] Deleted from R2: ${key}`);
      return true;
    } catch (error) {
      // R2 doesn't throw error if object doesn't exist
      console.log(`⚠️  [Avatar] Delete attempted: ${uid}.webp`);
      return false;
    }
  }

  /**
   * Check if avatar exists in R2
   */
  async exists(uid) {
    try {
      if (!this.r2Enabled) {
        return false;
      }

      const key = `avatars/${uid}.webp`;
      
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      return true;
    } catch {
      return false;
    }
  }
}

export default new AvatarService();