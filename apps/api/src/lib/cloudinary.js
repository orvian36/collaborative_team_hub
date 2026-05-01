// Cloudinary helper: upload buffer + destroy by public id.
// Uses environment variables CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
// already documented in apps/api/.env.example.

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a buffer to Cloudinary. Returns the secure URL.
 *
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {string} opts.folder  e.g. 'team-hub/workspaces'
 * @param {string} opts.publicId  workspace UUID (for stable replacement)
 * @returns {Promise<string>} secure URL
 */
const uploadBuffer = (buffer, { folder, publicId }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/**
 * Best-effort destroy by public id. Logs on error and resolves anyway —
 * orphaned images are cleanup, not correctness.
 */
const destroyByPublicId = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('cloudinary destroy failed for', publicId, err.message);
  }
};

module.exports = { uploadBuffer, destroyByPublicId };
