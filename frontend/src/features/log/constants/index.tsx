import classNames from "classnames";
import { Card, Typography } from "antd";
import { useState } from "react";
import constants from "@shared/constants.json";
import {
  PiArrowClockwise,
  PiArrowsClockwise,
  PiArrowsClockwiseBold,
  PiMinus,
  PiMinusBold,
  PiPlus,
  PiPlusBold,
} from "react-icons/pi";

const editTypes = {
  1: "Agregó",
  2: "Editó",
  3: "Eliminó",
  4: "Vinculó",
  5: "Desvinculó",
};

type Change = {
  old?: string;
  new?: string;
};

const { Text } = Typography;

export const generateDateTime = (dateTime) => {
  const [date, time, meridian] = dateTime.split(" ");
  return (
    <>
      <p className="font-bold m-0">{date}</p>
      <p className="m-0">
        {time}
        {meridian.toLowerCase()}
      </p>
    </>
  );
};

export const generateTitle = (
  movement,
  action,
  prefix,
  module,
  data,
  url,
  validateAndRedirect
) => {
  console.log(movement, action, module, data, prefix);
  return (
    <div>
      Ha {action}
      {movement == "delete" && module == "Pallet" && (
        <>
          {" "}
          de la orden{" "}
          <span
            onClick={() => {
              let destinationUrl;
              switch (data.extra?.entryOrder[0]?.type) {
                case "picklist":
                  destinationUrl = `/warehouse/picklist/${data.id}/material`;
                  break;

                default:
                  destinationUrl = `/warehouse/${
                    data.extra?.entryOrder[0]?.type === "LE"
                      ? "local"
                      : "intransit"
                  }/view_confirmed/${data.id}`;
                  break;
              }
              validateAndRedirect(destinationUrl);
            }}
            rel="noreferrer"
            className={classNames(
              "font-bold text-blue-500 hover:text-blue-700 cursor-pointer"
            )}
          >
            {data.extra?.entryOrder[0]?.order}{" "}
            <Text copyable={{ text: data.extra?.entryOrder[0]?.order }}></Text>
          </span>
        </>
      )}
      {movement == "add_image" ? "" : " " + prefix + " " + module + " "}
      {movement == "add_image" ? (
        "una imagen "
      ) : movement == "update_container" ? (
        <span
          className={
            data.name == "Buen estado" ? "text-success" : "text-danger"
          }
        >
          {data.name}{" "}
        </span>
      ) : movement == "change_qty" ? (
        <span
          className="text-blue-500 hover:text-blue-700 cursor-pointer font-bold"
          onClick={() => {
            console.log(data.id);
          }}
        >
          {data.name} <Text copyable={{ text: data.name }}></Text>
        </span>
      ) : (
        <span
          onClick={() => url !== "#" && validateAndRedirect(url)}
          rel="noreferrer"
          className={classNames(
            "font-bold",
            url === "#"
              ? "cursor-not-allowed text-gray-500 hover:text-gray-500"
              : "text-blue-500 hover:text-blue-700 cursor-pointer"
          )}
        >
          {data?.name} <Text copyable={{ text: data?.name }}></Text>
        </span>
      )}
    </div>
  );
};

export const generateDescription = (data) => {
  let editedDescription = null;
  let filesDescription = null;
  let materialsDescription = null;
  let crosscheckReport = null;

  const editedData: Record<string, Change> = data?.edited_data;

  if (editedData) {
    editedDescription = Object.entries(editedData).map(([field, values]) => (
      <div key={field} className="timeline__description__item mb-1">
        <p className="flex items-center">
          {values.old && values.new ? (
            // Editado
            <>
              <PiArrowsClockwiseBold className="mr-2 color-yellow"/>
              <span className="mr-2">{constants.COLUMNS[field] ?? field}</span>
              <span>
                <span className="font-bold color-yellow">{values.old}</span> cambió a <span className="font-bold color-green">{values.new}</span>
              </span>
            </>
          ) : values.new ? (
            // Agregado
            <>
              <PiPlusBold className="mr-2 text-green-500"/>
              <span className="mr-2">Se agregó {constants.COLUMNS[field] ?? field}</span>
              <span className="font-bold color-green">{values.new}</span>
            </>
          ) : values.old ? (
            // Eliminado
            <>
              <PiMinusBold className="mr-2 text-red-500"/>
              <span className="mr-2">Se eliminó {constants.COLUMNS[field] ?? field}</span>
              <span className="font-bold color-red">{values.old}</span>
            </>
          ) : null}
        </p>
      </div>
    ));
  }

  if (data?.extra?.files) {
    filesDescription = data.extra.files.map((file, index) => (
      <div key={index} className="timeline__description__item">
        {file.url ? (
          <a href={file.url} download={file.name}>
            {file.name}
          </a>
        ) : (
          <span>{file.name}</span>
        )}
      </div>
    ));
  }

  const result = (
    <>
      {editedDescription}
      {filesDescription}
      {materialsDescription}
      {crosscheckReport}
    </>
  );

  if (
    editedDescription ||
    filesDescription ||
    crosscheckReport ||
    materialsDescription
  ) {
    return result;
  }
};
