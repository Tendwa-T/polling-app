import EnterDetailsComponent from "@/app/components/EnterCode";
import NavbarComponent from "@/app/components/Navbar";
import { Box, Typography } from "@mui/material";

export default function Home() {
  return (
    <>
      <Box>
        <NavbarComponent />
        <EnterDetailsComponent />
      </Box>
    </>
  );
}
