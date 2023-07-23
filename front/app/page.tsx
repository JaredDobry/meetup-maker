"use client";
import React from "react";
import {
  CircularProgress,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";
import { Login } from "./pages/login";

const WSS_ADDRESS = "wss://localhost:8765";
const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;

export default function Home() {
  const [socket, setSocket] = React.useState<WebSocket>();

  const connect = React.useCallback((retry: number) => {
    setSocket(undefined);
    const s = new WebSocket(WSS_ADDRESS);
    s.onopen = () => {
      console.log("Socket open");
      setSocket(s);
    };
    s.onmessage = (ev) => {
      console.log(`Message: ${ev.data}`);
    };
    s.onclose = () => {
      s.close();
      console.log(`Socket closed. Reconnecting in ${retry / 1000}s`);
      setTimeout(() => {
        connect(Math.min(MAX_RETRY_MS, retry + retry));
      }, retry);
    };
    s.onclose = (err) => {
      s.close();
      console.log(`Socket error. Reconnecting in ${retry / 1000}s`);
      setTimeout(() => {
        connect(Math.min(MAX_RETRY_MS, retry + retry));
      }, retry);
    };
  }, []);

  React.useEffect(() => {
    connect(MIN_RETRY_MS);
  }, [connect]);

  return (
    <>
      <CssBaseline />
      {!socket && (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={4}
          height="100vh"
        >
          <Typography variant="h3">Connecting to Meetup Maker</Typography>
          <CircularProgress />
        </Stack>
      )}
      {socket && <Login ws={socket} />}
    </>
  );
}
