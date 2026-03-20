import { Spin } from "@/lib/antd-compat";

const Loader = () => {
  return (
    <div className="grid place-items-center w-full h-[200px]">
      <Spin />
    </div>
  );
};

export default Loader;