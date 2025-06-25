import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { UserData, UserRole } from "@/types/auth";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

interface UpdateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: Partial<Omit<UserData, "uid">>) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading: boolean;
  isDeleting?: boolean;
  user: UserData;
}

export function UpdateUserDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  isDeleting = false,
  user,
}: UpdateUserDialogProps) {
  const [email, setEmail] = React.useState(user.email || "");
  const [name, setName] = React.useState(user.displayName || "");
  const [role, setRole] = React.useState<UserRole>(user.role);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const { userData } = useAuth();

  React.useEffect(() => {
    setEmail(user.email || "");
    setName(user.displayName || "");
    setRole(user.role);
    setShowDeleteConfirm(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Omit<UserData, "uid">> = {};

    if (email !== user.email) updates.email = email;
    if (name !== user.displayName) updates.displayName = name;
    if (role !== user.role) updates.role = role;

    await onSubmit(updates);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    await onDelete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.uid !== userData?.uid && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  textDecoration: "underline",
                  color: "crimson",
                  background: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                {isDeleting ? (
                  <>
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : showDeleteConfirm ? (
                  "Click again to confirm delete"
                ) : (
                  "Delete User"
                )}
              </button>
            )}
          </div>
          <DialogFooter
            style={{
              borderTop: "1px solid rgba(100 100 100/ 20%)",
              paddingTop: "0.5rem",
              display: "flex",
            }}
          >
            <Button
              style={{ flex: 1 }}
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-gray-950 dark:bg-white"
              style={{ flex: 1 }}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
