import { Empty } from "antd";
import PageLayout from "@layouts/page-layout/PageLayout";
import useCurrentReleaseNote from "@features/releases-notes/hooks/useCurrentReleaseNote";
import ReleaseNote from "@features/releases-notes/components/ReleaseNote";
import Loader from "@components/Loader";

const WhatsNew = () => {
  const { data: releaseNote, isLoading: loadingReleaseNote } =
    useCurrentReleaseNote();

  if (loadingReleaseNote) {
    return <Loader />;
  }

  return (
    <PageLayout title="Novedades">
      <div className="max-w-[800px] m-auto">
        {releaseNote ? (
          <ReleaseNote releaseNote={releaseNote} />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay novedades para mostrar"
          />
        )}
      </div>
    </PageLayout>
  );
};

export default WhatsNew;
