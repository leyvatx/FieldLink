import { Card, Divider } from "antd";
import ReleaseSections from "@features/releases-notes/components/ReleaseSections";
import ReleaseNoteResume from "@features/releases-notes/components/ReleaseNoteResume";

const ReleaseNote = ({ releaseNote = null, showAdminInfo = false }) => {
  const { sections, ...rest } = releaseNote ?? {};

  return (
    <Card className="elevation-1 !mb-5">
      <ReleaseNoteResume
        releaseNote={rest}
        showAdminInfo={showAdminInfo}
      />
      <Divider />
      <ReleaseSections sections={sections} />
    </Card>
  );
};

export default ReleaseNote;
