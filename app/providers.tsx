'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

const theme = createTheme({
  palette: {
    primary: {
      main: '#23695C'
    },
    secondary: {
      main: '#FFB800'
    }
  }
});

const Providers = ({ children }: {
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
