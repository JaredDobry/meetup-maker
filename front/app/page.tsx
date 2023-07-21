"use client";
import React from "react";
import { CssBaseline } from "@mui/material";
import { Login } from "./pages/login";

const socket = new WebSocket("wss://localhost:8765");

export default function Home() {
  const [socketOpen, setSocketOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const onOpen = () => {
      setSocketOpen(true);
    };
    socket.addEventListener("open", onOpen);
    return () => {
      socket.removeEventListener("open", onOpen);
    };
  }, []);

  React.useEffect(() => {
    const onClose = () => {
      setSocketOpen(false);
    };
    socket.addEventListener("close", onClose);
    return () => {
      socket.removeEventListener("close", onClose);
    };
  }, []);

  // TODO: Remove debug listener
  React.useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      console.log(ev.data);
    };
    socket.addEventListener("message", onMessage);
    return () => {
      socket.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <>
      <CssBaseline />
      {socketOpen && <Login ws={socket} />}
    </>
  );
}
