import PageLayout from "@layouts/page-layout/PageLayout";
import Filters from "@features/log/components/filters";
import TimeLine from "@features/log/components/timeline";
// import { useState } from "react";
import { PiFunnelFill } from "react-icons/pi";
import { Drawer, Card } from "antd";
import { LogProvider } from "@features/log/contexts/log-context";
// import { useWindowSize } from "@hooks/useWindowSize";

const Log = () => {
  return (
    <PageLayout title="Log general">
      <LogProvider>
        <div className="log__container">
          <Filters />
          <TimeLine />
        </div>
      </LogProvider>
    </PageLayout>
  );
};

export default Log;
