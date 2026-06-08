import { SelloraIcon } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <SelloraIcon size={40} />
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/2 rounded-full bg-[#3b9ded] animate-[loadingbar_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
