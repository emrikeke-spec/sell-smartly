import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, GripVertical } from 'lucide-react';

interface PhotoUploaderProps {
  photos: File[];
  photoUrls: string[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  photos,
  photoUrls,
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      addFiles(files);
    },
    [photos, maxPhotos]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newPhotos = [...photos, ...files].slice(0, maxPhotos);
    onPhotosChange(newPhotos);

    // Generate preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls].slice(0, maxPhotos));
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);

    // Revoke the URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const allPhotos = [
    ...photoUrls.map((url) => ({ type: 'url' as const, src: url })),
    ...previewUrls.map((url) => ({ type: 'preview' as const, src: url })),
  ];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          photos.length >= maxPhotos && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={photos.length >= maxPhotos}
        />
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <ImagePlus className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            Drag & drop photos here, or click to select
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Up to {maxPhotos} photos. First photo will be the cover.
          </p>
        </div>
      </div>

      {allPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allPhotos.map((photo, index) => (
            <div
              key={index}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border bg-muted group',
                index === 0 && 'ring-2 ring-primary'
              )}
            >
              <img
                src={photo.src}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  Cover
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5 text-foreground cursor-grab" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
