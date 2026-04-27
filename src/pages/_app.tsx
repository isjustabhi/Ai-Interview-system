import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15,23,42,0.9)",
            color: "#e2e8f0",
            border: "1px solid rgba(0,217,255,0.3)"
          }
        }}
      />
    </>
  );
}