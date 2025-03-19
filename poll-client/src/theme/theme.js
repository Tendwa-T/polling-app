"use client";

const { createTheme } = require("@mui/material");

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
});

const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
});

module.exports = {
  darkTheme,
  lightTheme,
};
