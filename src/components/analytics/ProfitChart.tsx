import { getAllProducts } from "@/services/firebase/pos";
import { Product } from "@/types/pos";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { Icons } from "../ui/icons";

export const ProfitChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await getAllProducts();

        // Calculate profit margins for each product
        const profitData = products.map((product: Product) => {
          const costPrice = product.price * 0.7; // Estimate cost as 70% of selling price
          const profitMargin =
            ((product.price - costPrice) / product.price) * 100;
          return {
            name: product.name,
            margin: Number(profitMargin.toFixed(1)),
            price: product.price,
          };
        });

        // Sort by profit margin and take top 7
        const sortedData = profitData
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 7);

        setData(sortedData);
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{ borderRadius: "0.5rem" }}
      className="bg-white dark:bg-gray-900 h-full w-full p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Profit</h3>
        <div className="text-sm text-gray-500"> Products</div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {/* <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              textAnchor="end"
              height={60}
            /> */}
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`${value}%`, "Margin"]}
              labelFormatter={(label) => `Product: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="margin"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#marginGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
