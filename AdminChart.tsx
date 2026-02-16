
import React from 'react';

// Mock data for the chart
const chartData = {
    labels: ['-6d', '-5d', '-4d', '-3d', '-2d', 'Yday', 'Today'],
    revenue: [120, 150, 200, 180, 250, 220, 300],
    users: [5, 8, 6, 10, 7, 12, 9],
};

const AdminChart: React.FC = () => {
    const width = 500;
    const height = 200;
    const padding = 40;

    const maxRevenue = Math.max(...chartData.revenue);
    const maxUsers = Math.max(...chartData.users);

    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (chartData.labels.length - 1);
    const getRevenueY = (value: number) => height - padding - (value / maxRevenue) * (height - 2 * padding);
    const getUsersY = (value: number) => height - padding - (value / maxUsers) * (height - 2 * padding);

    const revenuePath = chartData.revenue.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getRevenueY(val)}`).join(' ');
    const usersPath = chartData.users.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getUsersY(val)}`).join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis Grid Lines */}
                {[...Array(5)].map((_, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + (i * (height - 2 * padding)) / 4}
                        x2={width - padding}
                        y2={padding + (i * (height - 2 * padding)) / 4}
                        stroke="currentColor"
                        className="text-gray-700"
                        strokeWidth="1"
                    />
                ))}
                
                {/* X-Axis Labels */}
                {chartData.labels.map((label, i) => (
                    <text
                        key={i}
                        x={getX(i)}
                        y={height - padding + 15}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-current text-gray-400"
                    >
                        {label}
                    </text>
                ))}

                {/* Y-Axis Labels (Revenue) */}
                {[...Array(5)].map((_, i) => (
                    <text
                        key={i}
                        x={padding - 10}
                        y={padding + (i * (height - 2 * padding)) / 4}
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fontSize="10"
                        className="fill-current text-brand-cyan"
                    >
                        {Math.round(maxRevenue * (1 - i / 4))}
                    </text>
                ))}
                
                 {/* Y-Axis Labels (Users) */}
                {[...Array(5)].map((_, i) => (
                    <text
                        key={i}
                        x={width - padding + 10}
                        y={padding + (i * (height - 2 * padding)) / 4}
                        textAnchor="start"
                        alignmentBaseline="middle"
                        fontSize="10"
                        className="fill-current text-brand-pink"
                    >
                        {Math.round(maxUsers * (1 - i / 4))}
                    </text>
                ))}


                {/* Revenue Path */}
                <path d={revenuePath} stroke="#00F2FF" strokeWidth="2" fill="none" />
                {chartData.revenue.map((val, i) => (
                    <circle key={i} cx={getX(i)} cy={getRevenueY(val)} r="3" fill="#00F2FF" />
                ))}

                {/* Users Path */}
                <path d={usersPath} stroke="#F000B8" strokeWidth="2" fill="none" />
                {chartData.users.map((val, i) => (
                    <circle key={i} cx={getX(i)} cy={getUsersY(val)} r="3" fill="#F000B8" />
                ))}

            </svg>
            <div className="flex justify-center items-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-cyan"></div>
                    <span className="text-gray-300">Revenue</span>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-pink"></div>
                    <span className="text-gray-300">New Users</span>
                </div>
            </div>
        </div>
    );
};

export default AdminChart;