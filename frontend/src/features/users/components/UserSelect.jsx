import { Select } from "antd";
import useUsers from "@features/users/hooks/useUsers";

const UserSelect = ({ value, onChange, ...props }) => {
  const { data: users, isLoading: loadingUsers } = useUsers();

  const onSelectFilter = (input, option) =>
    option?.label?.toLowerCase()?.includes(input?.toLowerCase());

  return (
    <Select
      value={value}
      onChange={onChange}
      options={users?.map((user) => ({
        value: user.id,
        label: user.full_name,
      }))}
      loading={loadingUsers}
      showSearch
      filterOption={onSelectFilter}
      {...props}
    />
  );
};

export default UserSelect;
