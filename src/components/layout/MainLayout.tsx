interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  // const {  logout } = useAuth();
  // const navigate = useNavigate();

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate("/login");
  //   } catch (error) {
  //     console.error("Failed to logout:", error);
  //   }
  // };

  return (
    <div style={{}} className="">
      {/* <header
        style={{
          background: "white",
          color: "black",
          // border: "3px solid green",
          // padding: "1rem",
        }}
        className=""
      > */}
      {/* <div className="flex flex-1 items-center justify-between">
          <nav className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <Icons.logo className="h-6 w-6" />
              <span
                className="font-bold inline-block"
                style={{ fontSize: "1.5rem" }}
              >
                Dashboard
              </span>
            </Link>
            {userData?.role === "admin" && (
              <Link
                to="/admin"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
            {(userData?.role === "admin" || userData?.role === "manager") && (
              <Link
                to="/manager"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Manager
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Icons.user className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Role: {userData?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div> */}
      {/* </header> */}
      <main className="">
        <div className="" style={{ border: "", height: "" }}>
          {children}
        </div>
      </main>
    </div>
  );
};
