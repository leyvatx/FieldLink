import { Input, Segmented, Select, Tag, DatePicker, Divider } from "antd";
const { RangePicker } = DatePicker;
import { PiListBullets, PiRows, PiUserCircle } from "react-icons/pi";
import SelectUsers from "../../../common/components/users/autocomplete";
import classNames from "classnames";
import { movementsType, modules } from "../../../utils/constants/intranet-log";
import { useContext } from "react";
import { LogContext } from "../contexts/log-context";

const Filters = () => {
  const {
    listType,
    setListType,
    setFilterInvoice,
    setFilterDate,
    selectedMovements,
    setSelectedMovements,
    selectedModules,
    setSelectedModules,
    selectedUsers,
    setSelectedUsers,
  } = useContext(LogContext);
  movementsType.sort((a, b) => a.label.localeCompare(b.label));
  modules.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="filters__container">
      <div className="filters__search">
        <Segmented
          className=""
          block
          options={[
            {
              label: (
                <span className="flex flex-col items-center gap-1">
                  <PiRows className="text-lg mt-2" />
                  <span>Linea de tiempo</span>
                </span>
              ),
              value: "block",
            },
            {
              label: (
                <span className="flex flex-col items-center gap-1">
                  <PiListBullets className="text-lg mt-2" />
                  <span>Compacta</span>
                </span>
              ),
              value: "list",
            },
          ]}
          value={listType}
          onChange={(value) => {
            setListType(value);
            localStorage.setItem("listType", value);
          }}
        />
      </div>
      <Divider className="my-2" />
      <div className="filters__filters">
        <Input.Search
          placeholder="Buscar"
          onSearch={(value) => setFilterInvoice(value)}
        />
        <div className="mb-2">
          <span className="text-sm mb-2 block">Fecha</span>
          <RangePicker
            className="w-full"
            onChange={(_, dateString) => {
              if (dateString[0] && dateString[1]) {
                setFilterDate({ start: dateString[0], end: dateString[1] });
              } else {
                setFilterDate(null);
              }
            }}
          />
        </div>
        <div>
          <span className="text-sm mb-2 block">Movimientos</span>
          <Select
            mode="multiple"
            tagRender={() => <></>}
            allowClear
            value={selectedMovements.map((m) => m.id)}
            onChange={(value) => {
              setSelectedMovements(
                movementsType.filter((m) => value.includes(m.id))
              );
            }}
            style={{ width: "100%" }}
            placeholder="Seleccione un movimiento"
            options={movementsType.map((movement) => ({
              label: movement.label,
              value: movement.id,
            }))}
            filterOption={(input, option) => {
              if (option) {
                return option?.label
                  ?.toLowerCase()
                  .includes(input.toLowerCase());
              } else {
                return false;
              }
            }}
          />
          <div className={classNames("mt-2 rounded-lg")}>
            {selectedMovements.map((movement) => (
              <Tag
                key={movement.id}
                color="green"
                closable
                onClose={() => {
                  setSelectedMovements(
                    selectedMovements.filter((m) => m.id !== movement.id)
                  );
                }}
                bordered={false}
                style={{
                  marginInlineEnd: 4,
                  cursor: "default",
                  margin: 2,
                  padding: 2,
                  border: "1px solid rgb(137 209 106)",
                }}
              >
                {movement.label}
              </Tag>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm mb-2 block">Modulo</span>
          <Select
            mode="multiple"
            tagRender={() => <></>}
            allowClear
            value={selectedModules.map((m) => m.id)}
            onChange={(value) => {
              setSelectedModules(modules.filter((m) => value.includes(m.id)));
            }}
            style={{ width: "100%" }}
            placeholder="Please select"
            options={modules.map((module) => ({
              label: module.label,
              value: module.id,
            }))}
            filterOption={(input, option) => {
              if (option) {
                return option.label.toLowerCase().includes(input.toLowerCase());
              } else {
                return false;
              }
            }}
          />
          <div className={classNames("mt-2 rounded-lg")}>
            {selectedModules.map((module) => (
              <Tag
                key={module.id}
                color="purple"
                closable
                onClose={() => {
                  setSelectedModules(
                    selectedModules.filter((m) => m.id !== module.id)
                  );
                }}
                bordered={false}
                style={{
                  marginInlineEnd: 4,
                  cursor: "default",
                  margin: 2,
                  padding: 2,
                  border: "1px solid #9a7dc9",
                }}
              >
                {module.label}
              </Tag>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm mb-2 block">Usuarios</span>
          <SelectUsers
            value={selectedUsers}
            onChange={(users) => {
              setSelectedUsers(users);
            }}
          />
          <div className={classNames("mt-2 rounded-lg")}>
            {selectedUsers.map((user) => (
              <Tag
                icon={
                  user.picture ? (
                    <img
                      height={17}
                      width={17}
                      className="rounded-full mr-2"
                      src={user.picture}
                      onError={(
                        e: React.SyntheticEvent<HTMLImageElement, Event>
                      ) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src =
                          "/img/user-circle.svg";
                      }}
                    />
                  ) : (
                    <span className="rounded-full mr-2">
                      <PiUserCircle size={17} />
                    </span>
                  )
                }
                key={user.value}
                color="purple"
                closable
                onClose={() => {
                  setSelectedUsers(
                    selectedUsers.filter((u) => u.value !== user.value)
                  );
                }}
                bordered={false}
                style={{
                  marginInlineEnd: 4,
                  cursor: "default",
                  margin: 2,
                  padding: "2px 6px",
                  border: "1px solid #9a7dc94d",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  borderRadius: 8
                }}
              >
                {user.label}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
