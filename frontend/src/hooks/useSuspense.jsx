import { Suspense, isValidElement } from "react";
import Loader from "@components/Loader";

const useSuspense = () => {
  const suspense = (element, fallback = <Loader />) => {
    if (!isValidElement(element)) {
      console.warn("useSuspense recibió un valor no válido.");
      return null;
    }

    return <Suspense fallback={fallback}>{element}</Suspense>;
  };

  return suspense;
};

export default useSuspense;
