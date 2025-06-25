import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useNavigate } from "react-router-dom";

export const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div
        className="text-center space-y-6"
        style={{
          display: "flex",
          flexFlow: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="space-y-2">
          <Icons.warning className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
          {/* <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p> */}
        </div>
        <Button
          style={{ padding: "0.5rem 1rem" }}
          onClick={() => navigate(-1)}
          variant="default"
        >
          Return
        </Button>
      </div>
    </div>
  );
};
