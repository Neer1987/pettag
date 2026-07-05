const MEDICAL_MARKER = '\n\n---PETTAG_MEDICAL---\n';

type MedicalPayload = {
  vaccinations?: string[];
  allergies?: string[];
};

export type PetMedicalDisplay = {
  notes: string;
  vaccinations: string[];
  allergies: string[];
};

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function findMedicalMarkerIndex(notes: string): number {
  const normalized = normalizeLineEndings(notes);
  const exact = normalized.indexOf(MEDICAL_MARKER);
  if (exact !== -1) return exact;

  const compactMarker = '---PETTAG_MEDICAL---';
  const compactIndex = normalized.indexOf(compactMarker);
  if (compactIndex === -1) return -1;

  let start = compactIndex;
  while (start > 0 && normalized[start - 1] === '\n') start -= 1;
  return start;
}

function cleanMedicalList(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];

  return values
    .flatMap((value) => {
      const trimmed = value.trim();
      if (!trimmed) return [];

      if (trimmed.startsWith('{') && trimmed.includes('vaccinations')) {
        try {
          const payload = JSON.parse(trimmed) as MedicalPayload;
          return [
            ...(Array.isArray(payload.vaccinations) ? payload.vaccinations : []),
            ...(Array.isArray(payload.allergies) ? payload.allergies : []),
          ];
        } catch {
          return [trimmed];
        }
      }

      return [trimmed];
    })
    .filter(Boolean);
}

export function decodeMedicalFromNotes(notes: string): PetMedicalDisplay {
  const normalized = normalizeLineEndings(notes);
  const markerIndex = findMedicalMarkerIndex(normalized);

  if (markerIndex === -1) {
    return { notes: normalized.trim(), vaccinations: [], allergies: [] };
  }

  const visibleNotes = normalized.slice(0, markerIndex).trim();
  const payloadText = normalized.slice(markerIndex).replace(/^\n*---PETTAG_MEDICAL---\n?/, '').trim();

  try {
    const payload = JSON.parse(payloadText) as MedicalPayload;
    return {
      notes: visibleNotes,
      vaccinations: Array.isArray(payload.vaccinations) ? payload.vaccinations.filter(Boolean) : [],
      allergies: Array.isArray(payload.allergies) ? payload.allergies.filter(Boolean) : [],
    };
  } catch {
    return { notes: visibleNotes, vaccinations: [], allergies: [] };
  }
}

export function mergeMedicalFields(input: {
  notes: string;
  vaccinations?: string[] | null;
  allergies?: string[] | null;
}): PetMedicalDisplay {
  const decoded = decodeMedicalFromNotes(input.notes);
  return {
    notes: decoded.notes,
    vaccinations: input.vaccinations?.length
      ? cleanMedicalList(input.vaccinations)
      : decoded.vaccinations,
    allergies: input.allergies?.length ? cleanMedicalList(input.allergies) : decoded.allergies,
  };
}

export function sanitizePetMedicalDisplay(input: {
  notes: string;
  vaccinations?: string[] | null;
  allergies?: string[] | null;
}): PetMedicalDisplay {
  const merged = mergeMedicalFields(input);
  return {
    notes: merged.notes.trim(),
    vaccinations: cleanMedicalList(merged.vaccinations),
    allergies: cleanMedicalList(merged.allergies),
  };
}

export function hasPetMedicalData(medical: PetMedicalDisplay): boolean {
  return medical.vaccinations.length > 0 || medical.allergies.length > 0 || medical.notes.length > 0;
}
