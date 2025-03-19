import { Box, Typography } from "@mui/material";
import NavbarComponent from "./components/Navbar";

export default function Home() {
  return (
    <Box>
      <NavbarComponent>
        <Typography>Hello World</Typography>
      </NavbarComponent>
    </Box>
  );
}
