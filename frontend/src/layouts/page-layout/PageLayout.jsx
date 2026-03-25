import useDocumentTitle from "@hooks/useDocumentTitle";
import Topbar from "./Topbar";

const PageLayout = ({ title, topbarOptions, searchConfig, children }) => {
  useDocumentTitle(title);

  return (
    <div className="page-layout relative grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] items-start gap-4 md:gap-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-highlight)_10%,rgba(255,255,255,0.08)),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-highlight)_12%,rgba(255,255,255,0.05)),transparent_70%)]" />
      <Topbar title={title} searchConfig={searchConfig}>
        {topbarOptions}
      </Topbar>
      <div className="min-h-0 min-w-0 pb-2 md:pb-3">
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;
