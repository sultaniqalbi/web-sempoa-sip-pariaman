import React from 'react';

interface MetricCardProps {
  title: string;
  count: string | number;
  growth: number;
  periodLabel?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  count,
  growth,
  periodLabel = "Sejak periode sebelumnya",
  icon,
  iconBgColor,
  iconColor,
}) => {
  const isPositive = growth >= 0;
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
          isPositive 
            ? 'bg-[#E8F5E9] text-[#388E3C] border-[#A5D6A7]' 
            : 'bg-[#FFF1F2] text-[#D32F2F] border-[#FECDD3]'
        }`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(growth)}%</span>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-bold text-[#757575]">{title}</h3>
        <p className="text-3xl font-extrabold text-[#424242] mt-2 mb-1">{count}</p>
        <p className="text-[11px] text-[#9E9E9E] font-medium">{periodLabel}</p>
      </div>
    </div>
  );
};

export default MetricCard;
