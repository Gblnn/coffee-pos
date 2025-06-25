import Back from "@/components/back";
import { CreateUserDialog } from "@/components/dialogs/CreateUserDialog";
import { DeleteUserDialog } from "@/components/dialogs/DeleteUserDialog";
import { UpdateUserDialog } from "@/components/dialogs/UpdateUserDialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { auth } from "@/config/firebase";
import {
  createUserData,
  deleteUserData,
  getAllUsers,
  updateUserData,
} from "@/services/firebase/user";
import { UserData, UserRole } from "@/types/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NewUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export default function UserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { userData } = useAuth();

  // Fetch users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleCreateUser = async (newUser: NewUserData) => {
    try {
      setIsCreating(true);
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // Create user data in Firestore
      await createUserData(
        {
          uid: userCredential.user.uid,
          email: newUser.email,
          displayName: newUser.name,
        },
        newUser.role
      );

      // Refresh user list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);

      toast.success("User created successfully!");
      setCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (updates: Partial<Omit<UserData, "uid">>) => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      await updateUserData(selectedUser.uid, updates);

      // Refresh user list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);

      toast.success("User updated successfully!");
      setUpdateDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      await deleteUserData(selectedUser.uid);

      // Refresh user list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);

      toast.success("User deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        // paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      className="relative min-h-screen bg-white dark:bg-gray-950"
    >
      <div className="flex flex-col h-screen">
        <div className="flex h-16 items-center justify-between border-b shadow-sm px-4">
          <div className="flex items-center gap-2">
            <Back />
            <h1 style={{ fontSize: "1.25rem" }} className="">
              Users
            </h1>
          </div>
        </div>

        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Icons.spinner className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  onClick={() => {
                    setSelectedUser(user);
                    setUpdateDialogOpen(true);
                  }}
                  key={user.uid}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-950 text-card-foreground shadow-sm"
                >
                  <div>
                    <h3 className="font-medium">
                      {user.displayName || "No name"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <span className="inline-block px-2 py-1 mt-1 text-xs rounded-full bg-primary/10 text-primary">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight />
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user);
                        setUpdateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button> */}
                    {/* {user.uid !== userData?.uid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Create User Dialog */}
        <CreateUserDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateUser}
          isLoading={isCreating}
        />

        {/* Update User Dialog */}
        {selectedUser && (
          <UpdateUserDialog
            isOpen={updateDialogOpen}
            onClose={() => {
              setUpdateDialogOpen(false);
              setSelectedUser(null);
            }}
            onSubmit={handleUpdateUser}
            onDelete={handleDeleteUser}
            isLoading={isUpdating}
            isDeleting={isDeleting}
            user={selectedUser}
          />
        )}

        {/* Delete User Dialog */}
        {selectedUser && (
          <DeleteUserDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={handleDeleteUser}
            isLoading={isDeleting}
            user={selectedUser}
          />
        )}
      </div>
    </div>
  );
}
