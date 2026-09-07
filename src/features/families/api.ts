import { supabase } from '@/lib/supabase';
import type { Patient, PatientInput } from '@/features/patients/types';
import { mapPatientError } from '@/features/patients/api';
import type { Family } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function getFamily(id: string): Promise<Family> {
  const { data, error } = await requireClient().from('families').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Family;
}

/**
 * Creates the shared Family Profile plus its first (primary contact) member.
 * Not transactional (Supabase JS has no cross-table transaction) — a failure
 * between steps leaves at most a harmless unset primary_contact_patient_id.
 */
export async function createFamily(
  familyName: string,
  primaryContact: PatientInput,
  notes?: string | null,
): Promise<{ family: Family; primaryContact: Patient }> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const { data: family, error: familyErr } = await db
    .from('families')
    .insert({ family_name: familyName, notes: notes ?? null, created_by: user?.id ?? null })
    .select()
    .single();
  if (familyErr) throw new Error(familyErr.message);

  const { data: patient, error: patientErr } = await db
    .from('patients')
    .insert({
      ...primaryContact,
      customer_type: 'family',
      family_id: family.id,
      relationship: primaryContact.relationship ?? 'Head of family',
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (patientErr) throw mapPatientError(patientErr);

  await db.from('families').update({ primary_contact_patient_id: patient.id }).eq('id', family.id);

  return { family: family as Family, primaryContact: patient as Patient };
}

export async function addFamilyMember(familyId: string, input: PatientInput): Promise<Patient> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const { data, error } = await db
    .from('patients')
    .insert({ ...input, customer_type: 'family', family_id: familyId, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw mapPatientError(error);
  return data as Patient;
}
