import { useParams } from "react-router-dom";
import PageLayout from "@layouts/page-layout/PageLayout";
import EditReleaseNoteForm from "@features/releases-notes/components/EditReleaseNoteForm";

const EditReleaseNote = () => {
  const { id } = useParams();

  return (
    <PageLayout title="Editar nota de versión">
      <div className="max-w-[800px] m-auto">
        <EditReleaseNoteForm id={id} />
      </div>
    </PageLayout>
  );
};

export default EditReleaseNote;
