import { useState } from "react";
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
      <ReleaseNotesTable filters={filters} />
    </PageLayout>
  );
};

export default ReleaseNotes;
