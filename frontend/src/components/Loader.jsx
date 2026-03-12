import { Spin } from "antd";

const Loader = () => {
  return (
    <div className="grid place-items-center w-full h-[200px]">
      <Spin />
    </div>
  );
};

export default Loader;