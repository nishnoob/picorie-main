import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Convert the file to a base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: "auto",
    });

    return new Response(JSON.stringify({ url: result.secure_url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return new Response("Error uploading image", { status: 500 });
  }
}
