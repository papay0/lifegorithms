import Image from "next/image";

interface ImageGridProps {
  images: string[];
  cols?: 2 | 3;
}

export function ImageGrid({ images, cols = 2 }: ImageGridProps) {
  const gridClass = cols === 3
    ? "grid grid-cols-2 md:grid-cols-3 gap-4 my-8"
    : "grid grid-cols-2 gap-4 my-8";

  return (
    <div className={gridClass}>
      {images.map((src, i) => (
        <Image
          key={i}
          src={src}
          width={800}
          height={600}
          className="rounded-lg"
          alt=""
        />
      ))}
    </div>
  );
}
