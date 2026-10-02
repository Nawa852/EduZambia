import React from 'react';
import { useSchool } from '@/hooks/useSchool';

/** School letterhead for printed documents — logo, name, EMIS, motto in the school's colour. */
export const SchoolBrandHeader: React.FC<{ title?: string }> = ({ title }) => {
  const { school } = useSchool();
  if (!school) return null;
  return (
    <div className="mb-3 flex items-center gap-3 border-b-4 pb-2" style={{ borderColor: school.primary_color }}>
      {school.logo_url && <img src={school.logo_url} alt={`${school.name} logo`} className="h-14 w-14 object-contain" />}
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold uppercase tracking-wide" style={{ color: school.primary_color }}>{school.name}</div>
        <div className="text-xs">
          {school.emis_number ? `EMIS ${school.emis_number}` : ''}{school.emis_number && school.motto ? ' · ' : ''}{school.motto ?? ''}
        </div>
      </div>
      {title && <div className="text-sm font-semibold uppercase">{title}</div>}
    </div>
  );
};

export default SchoolBrandHeader;
