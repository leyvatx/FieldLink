import { Typography } from "antd";
import { PiCheckBold, PiCopyFill, PiDiscordLogoFill } from "react-icons/pi";

const { Text } = Typography;

const ImportText = ({ text = null }) => {
  return (
    <div className="flex flex-col gap-3">
      <p>
        Copia el texto y pégalo en el canal de permisos de discord{" "}
        <PiDiscordLogoFill
          size={16}
          className="inline"
        />
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-md dark:bg-[#242334] border border-neutral-200 dark:border-none">
        <p className=" min-h-[50px] max-h-[300px] overflow-y-auto break-words break-all whitespace-normal">
          {text}
        </p>
        <Text
          copyable={{
            text: text,
            tooltips: ["Copiar texto", "Texto copiado"],
            icon: [
              <PiCopyFill
                size={20}
                className="!text-neutral-800 dark:!text-white"
              />,
              <PiCheckBold
                size={20}
                className="!text-green-600"
              />,
            ],
          }}
        />
      </div>
    </div>
  );
};

export default ImportText;
