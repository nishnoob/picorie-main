"use client";

import { useState, useEffect } from "react";
import { PhotoTile } from "./PhotoTile";
import { getPhotosFromAirtable } from "../utils/airtable";

interface AirtablePhoto {
  id: string;
  url: string;
}

export const PhotoGrid = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const photos = await getPhotosFromAirtable();
        setPhotos(photos);
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (isLoading) {
    return <div>Loading photos...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {photos.map((photo) => (
        <PhotoTile key={photo?.fields?.id} imageUrl={photo?.fields?.image} />
      ))}
      <PhotoTile />
    </div>
  );
};
