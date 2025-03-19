import { Box, Typography } from "@mui/material";
import NavbarComponent from "./components/Navbar";
import InteractionComponent from "./components/InteractionComponent";

export default function Home() {
  return (
    <Box>
      <NavbarComponent itemTitle={"Interactions"}>
        <InteractionComponent />
      </NavbarComponent>
    </Box>
  );
}
