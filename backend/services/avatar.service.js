// backend/services/avatar.service.js
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AvatarService {
  constructor() {
    this.avatarDir = path.join(__dirname, "../uploads/avatars");
    this.ensureDir();
  }

  async ensureDir() {
    try {
      await fs.access(this.avatarDir);
    } catch {
      await fs.mkdir(this.avatarDir, { recursive: true });
      console.log("✅ Avatar directory created");
    }
  }

  /**
   * Process and save avatar
   * - Sharp validates image (throws if invalid)
   * - Resize 256x256
   * - Strip metadata
   * - Convert WebP
   * - Save as <uid>.webp
   */
  async processAndSave(buffer, uid) {
    try {
      const filename = `${uid}.webp`;
      const filepath = path.join(this.avatarDir, filename);

      await sharp(buffer)
        .resize(256, 256, {
          fit: "cover",
          position: "center"
        })
        .webp({ 
          quality: 85,
          effort: 6
        })
        .toFile(filepath);

      console.log(`✅ [Avatar] Saved: ${filename}`);

      return `/uploads/avatars/${filename}`;
    } catch (error) {
      console.error("❌ [Avatar] Processing error:", error);
      
      if (error.message.includes("Input buffer") || error.message.includes("Input file")) {
        throw new Error("Invalid image file");
      }
      
      throw new Error("Failed to process avatar");
    }
  }

  async delete(uid) {
    try {
      const filename = `${uid}.webp`;
      const filepath = path.join(this.avatarDir, filename);
      
      await fs.unlink(filepath);
      console.log(`✅ [Avatar] Deleted: ${filename}`);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`⚠️  [Avatar] File not found: ${uid}.webp`);
        return false;
      }
      throw error;
    }
  }

  async exists(uid) {
    try {
      const filepath = path.join(this.avatarDir, `${uid}.webp`);
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

export default new AvatarService();