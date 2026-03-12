import { lazy } from "react";
import { Tooltip, Button } from "antd";
import { PiPlusBold } from "react-icons/pi";
import { useDialog } from "@context/DialogProvider";
import useSuspense from "@hooks/useSuspense";

const CreateReleaseNoteForm = lazy(() =>
  import("@features/releases-notes/components/CreateReleaseNoteForm")
);

const ReleaseNotesTopbarOptions = () => {
  const { openDrawer } = useDialog();
  const suspense = useSuspense();

  return (
    <>
      <Tooltip title="Registrar nueva nota">
        <Button
          color="default"
          variant="filled"
          icon={<PiPlusBold size={16} />}
          onClick={() =>
            openDrawer({
              title: "Registrar nueva nota",
              content: suspense(<CreateReleaseNoteForm />),
              width: 600,
            })
          }
        />
      </Tooltip>
    </>
  );
};

export default ReleaseNotesTopbarOptions;
