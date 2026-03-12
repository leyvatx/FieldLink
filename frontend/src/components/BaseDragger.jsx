import Dragger from "antd/es/upload/Dragger";

const BaseDragger = ({ ...props }) => {
  return (
    <Dragger {...props}>
      <p className="text-neutral-500 dark:text-neutral-400">
        <span className="font-semibold">Arrastre y suelte los archivos aquí</span> o
        haga click para seleccionar
      </p>
    </Dragger>
  );
};

export default BaseDragger;
