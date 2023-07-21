import { ArrowForward } from "@mui/icons-material";
import { Stack, Typography, TextField, IconButton } from "@mui/material";
import React from "react";

export const Login: React.FC = () => {
  const [username, setUsername] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");

  const tryLogin = React.useCallback(() => {}, [username, password]);

  return (
    <Stack
      alignItems="center"
      height="100vh"
      justifyContent="center"
      spacing={2}
    >
      <Typography variant="h4">Log into Meetup Maker</Typography>
      <TextField
        label="Username"
        onChange={(event) => {
          setUsername(event.target.value);
        }}
        value={username}
        variant="outlined"
      />
      <TextField
        autoComplete="current-password"
        label="Password"
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        type="password"
        value={password}
        variant="outlined"
      />
      <IconButton>
        <ArrowForward color="primary" />
      </IconButton>
    </Stack>
  );
};
