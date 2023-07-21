import { ArrowForward } from "@mui/icons-material";
import { Stack, Typography, TextField, IconButton } from "@mui/material";
import React from "react";

export const Code: React.FC = () => {
  const [code, setCode] = React.useState<string>("");
  return (
    <Stack
      alignItems="center"
      height="100vh"
      justifyContent="center"
      spacing={2}
    >
      <Typography variant="h4">Enter a meetup code</Typography>
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <TextField
          onChange={(event) => {
            setCode(event.target.value);
          }}
          value={code}
          variant="outlined"
        />
        <IconButton>
          <ArrowForward color="primary" />
        </IconButton>
      </Stack>
    </Stack>
  );
};
