import classNames from "classnames";
import { PiPencil } from "react-icons/pi";
import {
  generateDateTime,
  generateTitle,
  generateDescription,
} from "../constants";
import { ILog } from "../types";
import { modules, movementsType } from "@utils/constants/intranet-log";
import constants from "../../../../../shared/constants.json";
import { useState } from "react";
import { Avatar, Popover, message } from "antd";
import { getImageUrl } from "@api/profileService";
// import InfoUser from '@common/components/info-users';

const TimelineItem = ({
  data,
  isSameDate,
}: {
  data: ILog;
  isSameDate: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const showMessage = (
    type: "loading" | "success" | "error",
    content: string,
    key
  ) => {
    messageApi.open({
      key,
      type,
      content,
    });
  };
  const movement = movementsType.find((m) => m.id === data.movement_id);
  const module = modules.find((m) => m.id === data.module_id);
  const IconModule = module?.icon ?? PiPencil;
  const Icon = movement?.icon ?? PiPencil;
  const movementIconColor = movement?.color ?? "gray";
  const dateTime = generateDateTime(data.date_time);
  const title = generateTitle(
    movement?.name,
    movement?.action,
    module?.prefix,
    module?.label,
    data.data,
    module?.url && !["delete", "cancel"].includes(movement?.name ?? "")
      ? module?.url(
          data.data.id,
          module?.name === "picklist" ? movement?.name ?? "" : ""
        )
      : "#",
    validateAndRedirect
  );
  const description = generateDescription(data.data);
  const [hidden, setHidden] = useState(true);

  function validateAndRedirect(url) {
    if (isLoading) return;
    setIsLoading(true);
    showMessage("loading", "Cargando...", "notification");
    fetch(url)
      .then((response) => {
        if (response.ok) {
          window.open(url, "_blank");
        } else {
          showMessage(
            "error",
            "Este recurso ya no esta disponible.",
            "notification"
          );
        }
      })
      .catch(() => {
        showMessage(
          "error",
          "Este recurso ya no esta disponible.",
          "notification"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="timeline__item my-2">
      {contextHolder}
      <div className={`timeline__date ${isSameDate && "invisible"}`}>
        {dateTime}
      </div>
      <div className="timeline__icon--module">
        <IconModule size={22} />
      </div>
      <div className="timeline__profile">
        <div className="flex gap-2 items-center">
          <Avatar
            src={getImageUrl(data.user?.profile_picture)}
            className="timeline__avatar"
            size={"small"}
          >
            {data.user?.name[0] ?? ""}
            {data.user?.lastname[0] ?? ""}
          </Avatar>
          <p className="m-0">
            {data.user?.name.split(" ")[0] ?? ""}{" "}
            {data.user?.lastname.split(" ")[0] ?? ""}
          </p>
        </div>
      </div>
      <div
        className={classNames(
          "timeline__icon--movement",
          `timeline__icon--${movement?.color ?? "gray"}`
        )}
      >
        <span
          className="p-1 rounded-full"
        >
          <Icon />
        </span>
      </div>
      <div className="timeline__title" onClick={() => setHidden(!hidden)}>
        {title}
      </div>
      <div className="timeline__line"></div>
      <div
        className={classNames(
          "timeline__description",
          description && "timeline__description--bordered",
          hidden && "timeline__description--hidden"
        )}
      >
        {description}
      </div>
    </div>
  );
};

export default TimelineItem;
