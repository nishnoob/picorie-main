import { PhotoGrid } from '@/components/PhotoGrid';

export default function Home() {
  return (
    <main className="container mx-auto min-h-screen p-4">
      <h1 className="mb-8 text-3xl font-bold">Photo Gallery</h1>
      <PhotoGrid />
    </main>
  );
}
