import { Spin } from "antd";

const PageLoader = () => {
  return (
    <div className="layout h-screen grid place-items-center">
      <Spin size="large" />
    </div>
  );
};

export default PageLoader;
