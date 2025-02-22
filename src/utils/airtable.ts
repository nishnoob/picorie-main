const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = "gallery";

export interface GalleryPhoto {
  id: string;
  image: string;
  layout: string;
  cropData: CropData;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "px" | "%";
}

export async function uploadImageToAirtable(file: File) {
  try {
    // First upload to Cloudinary through our API route
    const cloudinaryUrl = await uploadToCloudinary(file);

    // Prepare the record data with the Cloudinary URL
    const record = {
      fields: {
        image: cloudinaryUrl,
        layout: "1x1", // Default layout
        cropData: null, // Initialize with no crop
      },
    };

    // Upload to Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airtable error details:", errorData);
      throw new Error(`Failed to upload to Airtable: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading to Airtable:", error);
    throw error;
  }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.url;
}

export async function getPhotosFromAirtable(): Promise<GalleryPhoto[]> {
  try {
    const records = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      },
    );

    if (!records.ok) {
      throw new Error("Failed to fetch photos from Airtable");
    }

    const data = await records.json();
    if (data?.records?.length === 0) {
      return [];
    }
    return data.records.map((record: any) => ({
      ...record.fields,
      cropData: record?.fields?.cropData
        ? JSON.parse(record.fields.cropData)
        : null,
    }));
  } catch (error) {
    console.error("Error fetching photos from Airtable:", error);
    return [];
  }
}

export async function updatePhotoLayout(recordId: string, layout: string) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            layout: layout,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airtable error details:", errorData);
      throw new Error(
        `Failed to update layout in Airtable: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating layout in Airtable:", error);
    throw error;
  }
}

export async function updatePhotoCrop(recordId: string, cropData: CropData) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            cropData: JSON.stringify(cropData),
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airtable error details:", errorData);
      throw new Error(
        `Failed to update crop data in Airtable: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating crop data in Airtable:", error);
    throw error;
  }
}
