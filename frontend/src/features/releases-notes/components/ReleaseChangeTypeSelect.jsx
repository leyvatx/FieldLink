import BaseSelect from "@components/BaseSelect";
import useReleaseChangeTypesOptions from "@features/releases-notes/hooks/useReleaseChangeTypesOptions";

const ReleaseChangeTypeSelect = ({ ...props }) => {
  const { data, isLoading } = useReleaseChangeTypesOptions();

  return (
    <BaseSelect
      {...props}
      options={
        data?.map((option) => ({
          value: option.value,
          label: option.label,
        })) ?? []
      }
      loading={isLoading}
    />
  );
};

export default ReleaseChangeTypeSelect;
