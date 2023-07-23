"use client";
import React from "react";
import {
  Button,
  CircularProgress,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";
import { Login } from "./pages/login";
import { useTokenStore } from "@/state";
import { Dashboard } from "./pages/dashboard";
import Cookies from "js-cookie";
import { ClientToken, Message, ServerToken } from "./api";

const WSS_ADDRESS = "wss://localhost:8765";
const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;

export default function Home() {
  const [socket, setSocket] = React.useState<WebSocket>();
  const email = useTokenStore((state) => state.email);
  const token = useTokenStore((state) => state.token);
  const setEmail = useTokenStore((state) => state.setEmail);
  const setFirstName = useTokenStore((state) => state.setFirstName);
  const setToken = useTokenStore((state) => state.setToken);
  const [promptLogin, setPromptLogin] = React.useState<boolean>(false);

  React.useEffect(() => {
    setEmail(Cookies.get("email"));
    setToken(Cookies.get("token"));
    if (Cookies.get("email") && Cookies.get("token")) {
      setPromptLogin(true);
    }
  }, [setEmail, setToken, setPromptLogin]);

  const connect = React.useCallback((retry: number) => {
    setSocket(undefined);
    const s = new WebSocket(WSS_ADDRESS);
    s.onopen = () => {
      console.log("Socket open");
      setSocket(s);
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

  if (!socket) {
    return (
      <>
        <CssBaseline />
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={4}
          height="100vh"
        >
          <Typography variant="h3">Connecting to Meetup Maker</Typography>
          <CircularProgress />
        </Stack>
      </>
    );
  }

  if (promptLogin && email && token) {
    return (
      <>
        <CssBaseline />
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={4}
          height="100vh"
        >
          <Typography variant="h3">Meetup Maker</Typography>
          <Typography variant="h4">Login as {email}?</Typography>
          <Stack direction="row" spacing={8}>
            <Button
              variant="outlined"
              onClick={() => {
                Cookies.remove("email");
                Cookies.remove("token");
                setEmail(undefined);
                setToken(undefined);
                setPromptLogin(false);
              }}
            >
              No
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const m = new ClientToken(email, token);
                const onToken = (ev: MessageEvent) => {
                  const s: ServerToken = JSON.parse(ev.data);
                  if (s.uuid !== m.uuid || s.type !== Message.TOKEN) return;

                  setPromptLogin(false);
                  if (s.ok) {
                    setFirstName(s.first_name);
                  } else {
                    setEmail(undefined);
                    setToken(undefined);
                  }

                  socket.removeEventListener("message", onToken);
                };
                socket.addEventListener("message", onToken);
                socket.send(JSON.stringify(m));
              }}
            >
              Yes
            </Button>
          </Stack>
        </Stack>
      </>
    );
  }

  return (
    <>
      <CssBaseline />
      {token ? <Dashboard /> : <Login ws={socket} />}
    </>
  );
}
