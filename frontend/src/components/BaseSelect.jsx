import { Select } from "antd";
import onSelectFilter from "@lib/onSelectFilter";

const BaseSelect = (props = {}) => {
  const {
    value = null,
    onChange = null,
    showSearch = true,
    popupMatchSelectWidth = false,
    ...rest
  } = props ?? {};

  return (
    <Select
      {...rest}
      value={value}
      onChange={onChange}
      showSearch={showSearch}
      filterOption={showSearch ? onSelectFilter : false}
      popupMatchSelectWidth={popupMatchSelectWidth}
    />
  );
};

export default BaseSelect;
