import { ImageUpload } from "@/components/image-upload";
import { SiteHeader } from "@/components/site-header";

export default function WorkflowPage() {
  return (
    <>
      <SiteHeader title="Example Title" />

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <ImageUpload />
          </div>
        </div>
      </div>
    </>
  );
}
