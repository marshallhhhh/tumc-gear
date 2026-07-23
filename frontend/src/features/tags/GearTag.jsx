import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { nanoid } from "nanoid";

export function GearTagFront() {
  const hasCreated = useRef(false);
  const [id, setId] = useState(null);
  const appUrl = import.meta.env.VITE_APP_URL;

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    setId(nanoid(6));
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        width: "54mm",
        height: "86mm",
        border: "1px solid black",
        boxSizing: "border-box",
        padding: "4mm",
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(/public/logo.svg)`,
        backgroundSize: "11mm",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div>
          <QRCodeSVG
            value={`${appUrl}/t/${id}`}
            includeMargin={false}
            style={{
              width: "100%",
              height: "100%",
              aspectRatio: "1/1",
              display: "block",
              borderRadius: "2mm 2mm 0 0",
            }}
          />
        </div>
        <div
          style={{
            height: "6mm",
            fontFamily: "monospace",
            backgroundColor: "white",
            textAlign: "center",
            backgroundColor: "white",
            color: "rgb(100,100,100)",
            borderRadius: "0 0 3mm 3mm",
          }}
        >
          {id}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "20mm",
          display: "flex",
          backgroundColor: "whitesmoke",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(180,180,180)",
          borderRadius: "3mm",
        }}
      >
        Short ID e.g HAR-001
      </div>
    </div>
  );
}

export function GearTagBack() {
  const hasCreated = useRef(false);
  const [id, setId] = useState(null);
  const appUrl = import.meta.env.VITE_APP_URL;

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    setId(nanoid(6));
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        width: "54mm",
        height: "86mm",
        border: "1px solid black",
        boxSizing: "border-box",
        padding: "2mm",
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(/public/logo.svg)`,
        backgroundSize: "11mm",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "whitesmoke",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "3mm",
        }}
      >
        <p>
          IF FOUND PLEASE RETURN TO THE TASMANIAN UNIVERSITY MOUNTAINEERING CLUB
          (TUMC)
        </p>
        <p style={{ fontSize: "13px", fontWeight: "bold" }}>
          tasuniclimbing@gmail.com
        </p>
        <p style={{ fontSize: "13px", fontWeight: "bold" }}>
          facebook.com/groups/tasuniclimbing
        </p>
      </div>
    </div>
  );
}
