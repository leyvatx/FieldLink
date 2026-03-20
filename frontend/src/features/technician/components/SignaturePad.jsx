import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/lib/antd-compat";
import { PiEraserBold } from "react-icons/pi";

const PAD_HEIGHT = 220;

const SignaturePad = ({ onChange, resetToken = 0, disabled = false }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isDrawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const configureCanvas = useCallback((preserveDrawing = false) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const snapshot =
      preserveDrawing && hasSignatureRef.current ? canvas.toDataURL("image/png") : null;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(container.clientWidth, 280);
    const height = PAD_HEIGHT;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.fillStyle = "#111827";
    context.lineWidth = 2.6;

    if (snapshot) {
      const image = new window.Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = snapshot;
    }
  }, []);

  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      hasSignatureRef.current = true;
      setHasSignature(true);
      onChangeRef.current?.({
        file: new File([blob], "firma-cliente.png", { type: "image/png" }),
      });
    }, "image/png");
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    hasSignatureRef.current = false;
    setHasSignature(false);
    onChangeRef.current?.({ file: null });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => configureCanvas(false));
    const handleResize = () => configureCanvas(true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [configureCanvas]);

  useEffect(() => {
    clearSignature();
    configureCanvas(false);
  }, [configureCanvas, clearSignature, resetToken]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const handlePointerDown = (event) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    isDrawingRef.current = true;
    canvas.setPointerCapture?.(event.pointerId);
    context.beginPath();
    context.arc(point.x, point.y, 1.25, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event) => {
    if (disabled || !isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishStroke = (event) => {
    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    isDrawingRef.current = false;
    exportSignature();
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[var(--ui-muted-foreground)]">
          Firma continua del cliente. Si necesitas reiniciar, usa limpiar.
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--ui-foreground)]">
            {hasSignature ? "Firma lista" : "Pendiente"}
          </span>
          <Button
            size="small"
            icon={<PiEraserBold size={14} />}
            onClick={clearSignature}
            disabled={disabled}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-[28px] border border-[var(--ui-border)] bg-white p-3 shadow-[var(--ui-shadow-soft)]"
      >
        <canvas
          ref={canvasRef}
          className="block w-full rounded-[20px] bg-white"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>
    </div>
  );
};

export default SignaturePad;
