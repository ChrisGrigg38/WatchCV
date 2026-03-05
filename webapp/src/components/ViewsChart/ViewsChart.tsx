import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { TrackingEvent } from "../../types";

interface Props {
  events: TrackingEvent[];
}

const ViewsChart = ({ events }: Props) => {
  const byDay: Record<string, number> = {};
  for (const ev of events) {
    const day = new Date(ev.createdAt).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
    });
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const data = Object.entries(byDay).map(([date, views]) => ({ date, views }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
        No events recorded yet.
      </div>
    );
  }

  return (
    <div data-testid="viewschart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#4f46e5" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ViewsChart