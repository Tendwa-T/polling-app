import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import "./globals.css";
import { Lato } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/theme/theme";
import { UserProvider } from "@/context/user/UserContext";
import { AppProvider } from "@/context/app/AppContext";

const roboto = Lato({
  weight: ["100", "300", "400", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata = {
  title: "Tildo Admin",
  description: "Tildo Admin page",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
        <UserProvider>
          <AppProvider>
            <AppRouterCacheProvider>
              <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </AppRouterCacheProvider>
          </AppProvider>
        </UserProvider>
      </body>
    </html>
  );
}
