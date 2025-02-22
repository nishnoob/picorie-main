const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = "gallery";

export async function uploadImageToAirtable(file: File) {
  try {
    // First upload to Cloudinary through our API route
    const cloudinaryUrl = await uploadToCloudinary(file);

    // Prepare the record data with the Cloudinary URL
    const record = {
      fields: {
        image: cloudinaryUrl,
        layout: "1x1", // Default layout
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

export async function getPhotosFromAirtable() {
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
    return data.records;
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
