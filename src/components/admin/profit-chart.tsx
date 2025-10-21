"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

type ProfitChartProps = {
    data: { name: string, total: number }[];
    totalProfit: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Client
            </span>
            <span className="font-bold text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Net Profit
            </span>
            <span className="font-bold">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const clientColors: Record<string, string> = {
    "HANA Creatives": "hsl(var(--chart-1))",
    "Flash": "hsl(var(--chart-2))",
    "DTS": "hsl(var(--chart-3))",
};


const renderCustomizedLabel = (totalProfit: number) => (props: any) => {
  const { x, y, width, height, value } = props;
  const percentage = totalProfit > 0 ? ((value / totalProfit) * 100).toFixed(1) : 0;
  
  const profitColor = value >= 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--destructive-foreground))';
  
  return (
    <g>
      <text x={x + width / 2} y={y - 10} fill="#666" textAnchor="middle" dy={-6} fontSize={12}>
        {formatCurrency(value)}
      </text>
      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dy={4} fontSize={12} fontWeight="bold">
        {`${percentage}%`}
      </text>
    </g>
  );
};

export function ProfitChart({ data, totalProfit }: ProfitChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value as number)}
        />
        <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip />} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={clientColors[entry.name] || 'hsl(var(--primary))'} />
          ))}
          <LabelList dataKey="total" content={renderCustomizedLabel(totalProfit)} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
