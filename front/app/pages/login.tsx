import { Stack, Typography, TextField, Button } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import {
  ClientLogin,
  ClientSignup,
  Message,
  ServerLogin,
  ServerSignup,
  User,
} from "../api";
import React from "react";

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

  React.useEffect(() => {
    const handleSignup = (ev: MessageEvent) => {
      const m: ServerSignup = JSON.parse(ev.data);
      if (m.uuid !== uuid || m.type !== Message.SIGNUP) return;

      if (m.ok) {
        setSending(false);
        console.log(`Signup ok! - ${m.token}`);
      } else {
        setSending(false);
        console.log(`Signup failed - ${m.reason}`);
      }
    };
    props.ws.addEventListener("message", handleSignup);
    return () => props.ws.removeEventListener("message", handleSignup);
  }, [props.ws, setSending, uuid]);

  React.useEffect(() => {
    const handleLogin = (ev: MessageEvent) => {
      const m: ServerLogin = JSON.parse(ev.data);
      if (m.uuid !== uuid || m.type !== Message.LOGIN) return;

      if (m.ok) {
        setSending(false);
        console.log(`Login ok! - ${m.token}`);
      } else {
        setSending(false);
        console.log(`Login failed - ${m.reason}`);
      }
    };
    props.ws.addEventListener("message", handleLogin);
    return () => props.ws.removeEventListener("message", handleLogin);
  }, [props.ws, setSending, uuid]);

  return (
    <Stack
      alignItems="center"
      height="100vh"
      justifyContent="center"
      spacing={2}
    >
      <Typography variant="h4">Meetup Maker</Typography>
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
                console.log("Sending loging request");
                const u = uuidv4();
                setUUID(u);
                const m: ClientLogin = {
                  uuid: u,
                  type: Message.LOGIN,
                  email: email,
                  password: password,
                };
                props.ws.send(JSON.stringify(m));
                console.log("Login request sent");
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
                console.log("Sending signup request");
                const u = uuidv4();
                setUUID(u);
                const m: ClientSignup = {
                  uuid: u,
                  type: Message.SIGNUP,
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
                  password: password,
                };
                props.ws.send(JSON.stringify(m));
                console.log("Signup request sent");
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
