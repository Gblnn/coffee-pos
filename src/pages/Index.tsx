import { SalesChart } from "@/components/analytics/SalesChart";
import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import {
  Book,
  Box,
  ChevronRight,
  DollarSign,
  Target,
  Ticket,
  Truck,
  UserRoundCog,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  return (
    <>
      <div
        className="bg-white dark:bg-gray-950"
        style={{
          display: "flex",
          background: "",
          height: "100svh",
          flexFlow: "column",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div
          className="bg-white dark:bg-gray-950"
          style={{
            display: "flex",
            position: "fixed",
            width: "100%",
            borderBottom: "1px solid rgba(100 100 100/ 20%)",
            height: "",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "1px 1px 20px rgba(0 0 0/ 20%)",
          }}
        >
          <div
            style={{
              border: "",

              display: "flex",
              padding: "1rem",
              width: "100%",
              marginLeft: "0.5rem",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Target color="crimson" />
              {/* <img
                src="/icon512_maskable.png"
                alt="logo"
                style={{ width: "2.5rem" }}
              /> */}
              <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>PointSale</p>
              {/* <p style={{ fontSize: "0.8rem", fontWeight: 400, opacity: 0.5 }}>
                v1.1
              </p> */}
            </div>

            <div className="flex items-center gap-2">
              <button
                style={{
                  fontSize: "0.8rem",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
                onClick={() => navigate("/user-management")}
              >
                <UserRoundCog width={"1.25rem"} />
                Users
              </button>
              <IndexDropDown />
            </div>
          </div>
        </div>
        <div
          className="bg-gray-50 dark:bg-gray-950"
          style={{
            marginTop: "4.5rem",
            border: "",
            height: "100%",
            display: "flex",
            flexFlow: "column",
            padding: "1.25rem",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "1.1rem",
              fontWeight: "500",
              alignItems: "center",
              gap: "0.25rem",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Analytics <ChevronRight width={"1rem"} />
            </div>

            <Link
              style={{ fontSize: "0.9rem", color: "crimson", fontWeight: 500 }}
              to={"/analytics"}
            >
              See all
            </Link>
          </div>
          <div
            style={{
              border: "",
              padding: "",
              display: "flex",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                width: "12ch",
                height: "20ch",
                borderRadius: "0.75rem",
              }}
              className="dark:bg-gray-900"
            >
              <SalesChart />
            </div>
            {/* <div
              style={{
                display: "flex",
                flex: 1,
                width: "12ch",
                height: "20ch",

                borderRadius: "0.75rem",
              }}
              className="dark:bg-gray-900"
            >
              <ProfitChart />
            </div> */}
          </div>
          <p></p>
          {/* <Directive
            onClick={() => navigate("/user-management")}
            title={"Manage Users"}
            icon={<Users width={"1.25rem"} />}
          /> */}
          <Directive
            onClick={() => navigate("/billing")}
            title={"Billing"}
            icon={<DollarSign color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/inventory")}
            title={"Inventory"}
            icon={<Box color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/suppliers")}
            title={"Suppliers"}
            icon={<Truck color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/credit-book")}
            title={"Credit Book"}
            icon={<Book color="crimson" />}
            tag={""}
          />
          <Directive
            onClick={() => navigate("/bills")}
            title={"Bills"}
            icon={<Ticket color="crimson" />}
          />
        </div>
      </div>
    </>
  );
}
