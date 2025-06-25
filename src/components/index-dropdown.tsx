import { useAuth } from "@/context/AuthContext";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { LoaderCircle, LogOut, RefreshCcw, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useState } from "react";
import { toast } from "sonner";
import { LogoutDialog } from "./dialogs/LogoutDialog";

interface Props {
  className?: string;
  onLogout?: () => Promise<void>;
}

export default function IndexDropDown({ className, onLogout }: Props) {
  const { userData, isOnline, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
      }
      // Redirect to login page after successful logout
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={className}
          style={{
            outline: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "none",
            height: "2.5rem",
            width: "2.5rem",
          }}
        >
          {userData?.displayName ? (
            <p>{getInitials(userData.displayName)}</p>
          ) : !isOnline ? (
            <UserX className="opacity-50" />
          ) : (
            <LoaderCircle className="animate-spin m-0.5" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 mr-5 mt-1">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {userData?.displayName
                      ? getInitials(userData.displayName)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-base font-semibold truncate">
                    {userData?.displayName || "No name"}
                  </p>
                  <p className="text-xs text-primary font-semibold opacity-75 truncate">
                    {userData?.email}
                  </p>
                  <span
                    style={{ width: "fit-content" }}
                    className="inline-flex items-center rounded-full px-2 py-0.5 mt-1 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {userData?.role}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>

            <div className="h-px bg-border my-1" />

            <DropdownMenuItem
              onClick={() => window.location.reload()}
              className="cursor-pointer"
            >
              <RefreshCcw className="mr-2 h-4 w-4 text-primary" />
              <span>Force Reload</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowLogoutDialog(true)}
              className="cursor-pointer"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4 text-destructive" />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
