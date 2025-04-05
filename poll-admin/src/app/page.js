import { Box } from "@mui/material";
import NavbarComponent from "./components/Navbar";
import EventsComponent from "./components/EventsComponent";

export default function Home() {
  return (
    <Box>
      <NavbarComponent>
        <EventsComponent />
      </NavbarComponent>
    </Box>
  );
}
