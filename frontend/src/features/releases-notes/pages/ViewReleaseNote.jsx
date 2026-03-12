import { useParams } from "react-router-dom";
import PageLayout from "@layouts/page-layout/PageLayout";
import useReleaseNote from "@features/releases-notes/hooks/useReleaseNote";
import ReleaseNote from "@features/releases-notes/components/ReleaseNote";
import Loader from "@components/Loader";

const ViewReleaseNote = () => {
  const { id } = useParams();
  const { data: releaseNote, isLoading: loadingReleaseNote } =
    useReleaseNote(id);

  return (
    <PageLayout title="Ver nota de versión">
      <div className="max-w-[800px] m-auto">
        {loadingReleaseNote ? (
          <Loader />
        ) : (
          <ReleaseNote releaseNote={releaseNote} showAdminInfo />
        )}
      </div>
    </PageLayout>
  );
};

export default ViewReleaseNote;
