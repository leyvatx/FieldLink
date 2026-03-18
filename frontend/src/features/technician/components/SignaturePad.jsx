import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Image } from "antd";
import { PiArrowClockwiseBold, PiEraserBold } from "react-icons/pi";

const PAD_HEIGHT = 180;

const SignaturePad = ({ onChange, resetToken = 0, disabled = false }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const previewUrlRef = useRef("");
  const [previewUrl, setPreviewUrl] = useState("");

  const configureCanvas = useCallback((preserveDrawing = true) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const previousImage = preserveDrawing && previewUrlRef.current
      ? previewUrlRef.current
      : null;
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
    context.lineWidth = 2.4;
    context.fillStyle = "#111827";

    if (previousImage) {
      const image = new window.Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = previousImage;
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

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      const nextPreviewUrl = URL.createObjectURL(blob);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      onChange?.({
        file: new File([blob], "firma-cliente.png", { type: "image/png" }),
        previewUrl: nextPreviewUrl,
      });
    }, "image/png");
  }, [onChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPreviewUrl("");
    onChange?.({ file: null, previewUrl: "" });
  }, [onChange]);

  useEffect(() => {
    configureCanvas(false);

    const handleResize = () => configureCanvas(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [configureCanvas]);

  useEffect(() => {
    clearSignature();
    configureCanvas(false);
  }, [clearSignature, configureCanvas, resetToken]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    []
  );

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
    context.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs ui-text-muted">
          Firma con el dedo, mouse o stylus.
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<PiArrowClockwiseBold size={14} />}
            onClick={() => configureCanvas(true)}
            disabled={disabled}
          >
            Ajustar
          </Button>
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
        className="rounded-2xl border ui-border-subtle bg-white p-2"
      >
        <canvas
          ref={canvasRef}
          className="block w-full rounded-xl"
          style={{ touchAction: "none", background: "#ffffff" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>

      {previewUrl ? (
        <div className="grid gap-2">
          <span className="text-xs ui-text-muted">Vista previa de firma</span>
          <Image
            src={previewUrl}
            alt="Vista previa de firma"
            className="max-w-full rounded-xl"
          />
        </div>
      ) : (
        <div className="text-sm ui-text-muted">
          Aún no se ha dibujado una firma.
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
