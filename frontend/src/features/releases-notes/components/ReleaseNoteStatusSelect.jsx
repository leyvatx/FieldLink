import BaseSelect from "@components/BaseSelect";
import useReleaseNoteStatusOptions from "@features/releases-notes/hooks/useReleaseNoteStatusOptions";

const ReleaseNoteStatusSelect = ({ ...props }) => {
  const { data, isLoading } = useReleaseNoteStatusOptions();

  return (
    <BaseSelect
      {...props}
      options={
        data?.map((status) => ({
          value: status.value,
          label: status.label,
        })) ?? []
      }
      loading={isLoading}
    />
  );
};

export default ReleaseNoteStatusSelect;
