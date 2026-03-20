/* eslint-disable react-refresh/only-export-components */
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Image,
  Input,
  InputNumber,
  Result,
  Row,
  Segmented,
  Skeleton,
  Space,
  Spin,
  statusColorStyles,
  Steps,
  Tag,
  Typography,
  inputVariants,
} from "@/lib/antd-compat/base";
import { SearchInput, AutoComplete, DatePicker, Select } from "@/lib/antd-compat/selects";

export { Form } from "@/lib/antd-compat/form";

export {
  Checkbox,
  Drawer,
  Dropdown,
  message,
  Modal,
  Popover,
  Tabs,
  Tooltip,
} from "@/lib/antd-compat/interactive";

export { Table } from "@/lib/antd-compat/table";
export { Upload } from "@/lib/antd-compat/upload";

const ConfigProvider = ({ children }) => children;
const theme = {
  darkAlgorithm: "dark",
  defaultAlgorithm: "light",
};

const InputCompat = Object.assign(Input, {
  Search: SearchInput,
});

export {
  Alert,
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Image,
  InputCompat as Input,
  InputNumber,
  ConfigProvider,
  Result,
  Row,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  statusColorStyles,
  Steps,
  Tag,
  Typography,
  inputVariants,
  theme,
};
