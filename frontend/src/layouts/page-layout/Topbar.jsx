import { Card } from "antd";
import UserMenu from "./UserMenu";

const Topbar = ({ title, children }) => {

  return (
    <Card styles={{ body: { padding: 8 } }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex  items-center gap-3">
          {children}
          <UserMenu />
        </div>
      </div>
    </Card>
  );
};

export default Topbar;
