import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PatientOverview } from './types';

/** Shown instead of letting the receptionist create a duplicate customer (spec §14). */
export function ExistingCustomerBanner({ patient }: { patient: PatientOverview }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-amber-800">Existing Customer Found</p>
        <p className="text-xs text-amber-700">
          {patient.full_name} ({patient.phone}) already has a profile.
        </p>
        <Button variant="secondary" onClick={() => navigate(`/patients/${patient.id}`)}>
          Open Existing Profile
        </Button>
      </div>
    </div>
  );
}
