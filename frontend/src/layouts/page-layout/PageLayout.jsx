import useDocumentTitle from "@hooks/useDocumentTitle";
import Topbar from "./Topbar";

const PageLayout = ({ title, topbarOptions, searchConfig, children }) => {
  useDocumentTitle(title);

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr] gap-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_70%)]" />
      <Topbar title={title} searchConfig={searchConfig}>
        {topbarOptions}
      </Topbar>
      <div className="h-full overflow-auto pb-3">{children}</div>
    </div>
  );
};

export default PageLayout;
