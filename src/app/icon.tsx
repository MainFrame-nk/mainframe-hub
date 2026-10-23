import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: "#090A0F",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00F0FF",
          borderRadius: "8px",
          border: "2px solid #8B5CF6",
          fontWeight: 900,
          fontFamily: "monospace",
        }}
      >
        M
        <span style={{ color: "#FF2A5F", marginLeft: "1px" }}>.</span>
      </div>
    ),
    { ...size }
  );
}