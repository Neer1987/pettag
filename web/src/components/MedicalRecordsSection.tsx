import { hasPetMedicalData, type PetMedicalDisplay } from '@/lib/pet-medical';

type MedicalRecordsSectionProps = {
  medical: PetMedicalDisplay;
};

function RecordBlock({
  title,
  values,
  chipClassName,
}: {
  title: string;
  values: string[];
  chipClassName?: string;
}) {
  if (values.length === 0) return null;

  return (
    <div className="medical-block">
      <h3 className="medical-block__title">{title}</h3>
      <div className="medical-block__chips">
        {values.map((value) => (
          <span key={value} className={chipClassName ?? 'medical-chip'}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MedicalRecordsSection({ medical }: MedicalRecordsSectionProps) {
  if (!hasPetMedicalData(medical)) return null;

  return (
    <>
      <p className="section-label content-block">Medical records</p>
      <section className="card medical-card">
        <RecordBlock title="Vaccinations" values={medical.vaccinations} />
        <RecordBlock title="Allergies" values={medical.allergies} chipClassName="medical-chip medical-chip--allergy" />
        {medical.notes ? (
          <div className="medical-block">
            <h3 className="medical-block__title">Notes for finder or vet</h3>
            <p className="medical-block__notes">{medical.notes}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
