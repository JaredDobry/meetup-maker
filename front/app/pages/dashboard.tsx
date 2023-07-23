import Cookies from "js-cookie";
import React from "react";

import { useTokenStore } from "@/state";
import { Button, Stack, Typography } from "@mui/material";

export function Dashboard() {
  const firstName = useTokenStore((state) => state.first_name);
  const setEmail = useTokenStore((state) => state.setEmail);
  const setToken = useTokenStore((state) => state.setToken);

  return (
    <Stack>
      <Typography>Hello {firstName}</Typography>
      <Button
        onClick={() => {
          Cookies.remove("email");
          Cookies.remove("token");
          setEmail(undefined);
          setToken(undefined);
        }}
      >
        Log Out
      </Button>
    </Stack>
  );
}
