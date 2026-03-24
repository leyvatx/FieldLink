import ModuleOverview from "@components/ModuleOverview";
import PageLayout from "@layouts/page-layout/PageLayout";
import Filters from "@features/log/components/filters";
import TimeLine from "@features/log/components/timeline";
import { LogProvider } from "@features/log/contexts/log-context";

const Log = () => {
  return (
    <PageLayout title="Log general">
      <div className="grid gap-6">
        <ModuleOverview
          badge="Log"
          title="Log general"
          subtitle="Actividad, auditoria y tiempo."
          tags={["Actividad", "Auditoria", "Tiempo"]}
        />
        <LogProvider>
          <div className="log__container">
            <Filters />
            <TimeLine />
          </div>
        </LogProvider>
        </div>
    </PageLayout>
  );
};

export default Log;
