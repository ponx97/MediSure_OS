import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ElementType;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, subtext }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {Icon && <div className="p-2 bg-teal-50 rounded-lg"><Icon className="h-5 w-5 text-teal-600" /></div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' && <ArrowUpRight className="h-4 w-4 mr-1" />}
            {trend === 'down' && <ArrowDownRight className="h-4 w-4 mr-1" />}
            {trend === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;