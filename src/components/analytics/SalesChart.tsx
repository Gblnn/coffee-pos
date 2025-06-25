import { getAllBills } from "@/services/firebase/pos";
import { CustomerPurchase } from "@/types/pos";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Icons } from "../ui/icons";

export const SalesChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bills = await getAllBills();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          return {
            date: startOfDay(date),
            endDate: endOfDay(date),
            sales: 0,
            transactions: 0,
          };
        }).reverse();

        // Process bills
        bills.forEach((bill: CustomerPurchase) => {
          const billDate = new Date(bill.date);
          const dayData = last7Days.find(
            (day) => billDate >= day.date && billDate <= day.endDate
          );
          if (dayData) {
            dayData.sales += bill.total;
            dayData.transactions += 1;
          }
        });

        // Format data for chart
        const chartData = last7Days.map((day) => ({
          date: format(day.date, "MMM dd"),
          sales: Number(day.sales.toFixed(3)),
          transactions: day.transactions,
        }));

        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "0.5rem",
          background: "rgba(100 100 100/ 10%)",
        }}
        className="flex items-center justify-center h-full"
      >
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "0.5rem",
        border: "1px solid rgba(100 100 100/ 50%)",
      }}
      className="bg-white dark:bg-gray-950 h-full w-full p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sales </h3>
        <div
          style={{ fontSize: "0.8rem", fontWeight: "600" }}
          className=" text-gray-500"
        >
          Past Week
        </div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer style={{}} width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* <CartesianGrid  vertical={false} /> */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            {/* <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} OMR`}
            /> */}
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(150, 150, 150, 0.15)",
                backdropFilter: "blur(16px)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [
                `${value.toFixed(3)} OMR`,
                "Sales",
              ]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
