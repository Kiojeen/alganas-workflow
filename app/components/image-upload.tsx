import { cn } from "@/lib/utils";

interface ImageUploadProps {
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export function ImageUpload({
  maxFiles = 1,
  accept = "image/*",
  disabled = false,
}: ImageUploadProps) {
  const isDragging = false;
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-8 text-center transition-all",
        "cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/30",
        disabled && "cursor-not-allowed opacity-50",
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <input
        type="file"
        multiple
        accept={accept}

        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={disabled}
        aria-label="Upload images"
      />
      <div className="flex flex-col items-center gap-3">
        <svg
          className={cn(
            "text-muted-foreground h-12 w-12",
            isDragging && "text-primary",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="text-sm">
          <p className="text-foreground font-medium">
            {isDragging ? "Drop images here" : "Click or drag images to upload"}
          </p>
          <p className="text-muted-foreground">
            Supports: PNG, JPG, WebP, GIF • Max {maxFiles} files
          </p>
        </div>
      </div>
    </div>
  );
}
