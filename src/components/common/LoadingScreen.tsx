import { Icons } from "@/components/ui/icons";

export const LoadingScreen = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#1a1a1a" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Icons.spinner className="h-8 w-8 animate-spin text-crimson" />
        <p className="text-sm opacity-60">Loading...</p>
      </div>
    </div>
  );
};
