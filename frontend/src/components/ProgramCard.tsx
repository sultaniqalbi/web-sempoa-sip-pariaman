import React from 'react';
import { Link } from 'react-router-dom';
import { EditIcon } from './SvgIcons';

interface ProgramCardProps {
  title: string;
  desc: string;
  color: string;
  age: string;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ title, desc, color, age }) => {
  return (
    <div className={`border p-6 rounded-2xl space-y-4 ${color}`}>
      <div>
        <span className="px-2.5 py-1 bg-white/10 text-white font-semibold text-[10px] rounded-full uppercase">
          {age}
        </span>
        <h3 className="font-extrabold text-xl mt-3 text-white">{title}</h3>
      </div>
      <p className="text-slate-300 text-xs leading-relaxed">
        {desc}
      </p>
      <div className="pt-2">
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-slate-950 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <span>Daftar Sekarang</span>
          <EditIcon size={12} />
        </Link>
      </div>
    </div>
  );
};

export default ProgramCard;
