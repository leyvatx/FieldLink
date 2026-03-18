import useDocumentTitle from "@hooks/useDocumentTitle";
import Topbar from "./Topbar";

const PageLayout = ({ title, topbarOptions, searchConfig, children }) => {
  useDocumentTitle(title);

  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-5">
      <Topbar title={title} searchConfig={searchConfig}>
        {topbarOptions}
      </Topbar>
      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
};

export default PageLayout;
