import { useState } from "react";
import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import ReleaseNotesTopbarOptions from "@features/releases-notes/components/ReleaseNotesTopbarOptions";
import ReleaseNotesTable from "@features/releases-notes/components/ReleaseNotesTable";

const ReleaseNotes = () => {
  const [filters, setFilters] = useState({});

  return (
    <PageLayout
      title="Notas de versión"
      topbarOptions={
        <ReleaseNotesTopbarOptions filters={filters} setFilters={setFilters} />
      }
    >
      <div className="grid gap-6">
        <ModuleOverview
          badge="Versiones"
          title="Notas de version"
          subtitle="Cambios, version y publicacion."
          tags={["Versiones", "Cambios", "Publicacion"]}
        />
        <ReleaseNotesTable filters={filters} />
      </div>
    </PageLayout>
  );
};

export default ReleaseNotes;
