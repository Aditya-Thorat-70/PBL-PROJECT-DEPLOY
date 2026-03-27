import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeSVG({ value, size = 180 }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 1,
          errorCorrectionLevel: "M",
          color: {
            dark: "#111827",
            light: "#ffffff",
          },
        });

        if (isMounted) {
          setDataUrl(url);
        }
      } catch {
        if (isMounted) {
          setDataUrl("");
        }
      }
    };

    generate();
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size, background: "#fff" }} />;
  }

  return <img src={dataUrl} alt="Room QR" width={size} height={size} />;
}