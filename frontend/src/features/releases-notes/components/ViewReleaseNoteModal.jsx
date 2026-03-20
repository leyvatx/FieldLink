import Loader from "@components/Loader";
import ReleaseNote from "@features/releases-notes/components/ReleaseNote";
import useReleaseNote from "@features/releases-notes/hooks/useReleaseNote";

const ViewReleaseNoteModal = ({ id }) => {
  const { data: releaseNote, isLoading } = useReleaseNote(id);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="mx-auto max-w-[920px]">
      <ReleaseNote
        releaseNote={releaseNote}
        showAdminInfo
      />
    </div>
  );
};

export default ViewReleaseNoteModal;
