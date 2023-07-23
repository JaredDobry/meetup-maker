import {
  Stack,
  Typography,
  TextField,
  Button,
  Collapse,
  Alert,
} from "@mui/material";
import {
  ClientLogin,
  ClientSignup,
  Message,
  ServerLogin,
  ServerSignup,
} from "../api";
import React from "react";
import { useTokenStore } from "@/state";
import Cookies from "js-cookie";

type LoginProps = {
  ws: WebSocket;
};

export const Login: React.FC<LoginProps> = (props) => {
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");

  const [isSignup, setIsSignup] = React.useState<boolean>(false);

  const [sending, setSending] = React.useState<boolean>(false);
  const [uuid, setUUID] = React.useState<string>("");

  const [error, setError] = React.useState<string>();
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false);

  const setStateEmail = useTokenStore((state) => state.setEmail);
  const setStateFirstName = useTokenStore((state) => state.setFirstName);
  const setToken = useTokenStore((state) => state.setToken);

  React.useEffect(() => {
    const handleSignup = (ev: MessageEvent) => {
      const m: ServerSignup = JSON.parse(ev.data);
      if (m.uuid !== uuid || m.type !== Message.SIGNUP) return;

      if (m.ok) {
        setSending(false);
        setToken(m.token);
        Cookies.set("token", m.token, { expires: 1 });
      } else {
        setSending(false);
        setError(m.reason);
        setErrorOpen(true);
      }
    };
    props.ws.addEventListener("message", handleSignup);
    return () => props.ws.removeEventListener("message", handleSignup);
  }, [props.ws, setSending, setToken, uuid]);

  React.useEffect(() => {
    const handleLogin = (ev: MessageEvent) => {
      const m: ServerLogin = JSON.parse(ev.data);
      if (m.uuid !== uuid || m.type !== Message.LOGIN) return;

      if (m.ok) {
        setSending(false);
        setToken(m.token);
        Cookies.set("token", m.token, { expires: 1 });
        setStateFirstName(m.first_name);
      } else {
        setSending(false);
        setError(m.reason);
        setErrorOpen(true);
      }
    };
    props.ws.addEventListener("message", handleLogin);
    return () => props.ws.removeEventListener("message", handleLogin);
  }, [props.ws, setSending, setStateFirstName, setToken, uuid]);

  React.useEffect(() => {
    const onClose = () => {
      setSending(false);
    };
    const onError = () => {
      setSending(false);
    };

    props.ws.addEventListener("close", onClose);
    props.ws.addEventListener("error", onError);

    return () => {
      props.ws.removeEventListener("close", onClose);
      props.ws.removeEventListener("error", onError);
    };
  }, [props.ws, setSending]);

  return (
    <Stack
      alignItems="center"
      height="100vh"
      justifyContent="center"
      spacing={2}
    >
      <Typography variant="h4">Meetup Maker</Typography>
      <Collapse in={errorOpen}>
        <Alert
          onClose={() => {
            setErrorOpen(false);
          }}
          severity="error"
        >
          {error}
        </Alert>
      </Collapse>
      {isSignup && (
        <>
          <TextField
            autoComplete="given-name"
            label="First Name"
            onChange={(event) => {
              setFirstName(event.target.value);
            }}
            value={firstName}
            variant="outlined"
          />
          <TextField
            autoComplete="family-name"
            label="Last Name"
            onChange={(event) => {
              setLastName(event.target.value);
            }}
            value={lastName}
            variant="outlined"
          />
        </>
      )}
      <TextField
        autoComplete="username"
        label="Email"
        onChange={(event) => {
          setEmail(event.target.value);
        }}
        value={email}
        variant="outlined"
      />
      <TextField
        autoComplete={isSignup ? "new-password" : "current-password"}
        label="Password"
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        type="password"
        value={password}
        variant="outlined"
      />
      <Stack direction="row" justifyContent="space-between" spacing={8}>
        {!isSignup && (
          <>
            <Button onClick={() => setIsSignup(true)}>Signup</Button>
            <Button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                Cookies.set("email", email, { expires: 1 });
                const m = new ClientLogin(email, password);
                setUUID(m.uuid);
                props.ws.send(JSON.stringify(m));

                setStateEmail(email);
                setStateFirstName(firstName);
              }}
              variant="contained"
            >
              Login
            </Button>
          </>
        )}
        {isSignup && (
          <>
            <Button onClick={() => setIsSignup(false)}>Login</Button>
            <Button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                Cookies.set("email", email, { expires: 1 });
                const m = new ClientSignup(
                  firstName,
                  lastName,
                  email,
                  password
                );
                setUUID(m.uuid);
                props.ws.send(JSON.stringify(m));

                setStateEmail(email);
              }}
              variant="contained"
            >
              Signup
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};
