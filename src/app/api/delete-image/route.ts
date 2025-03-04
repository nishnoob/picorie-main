import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return new Response('No image URL provided', { status: 400 });
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[extension]
    const urlParts = imageUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return new Response(JSON.stringify({ message: 'Image deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Failed to delete image', { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return new Response('Error deleting image', { status: 500 });
  }
}
