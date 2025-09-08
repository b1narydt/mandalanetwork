import React from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, Container, Typography } from '@mui/material'
import App from './App'
import theme from './theme'
import './App.scss'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Container sx={{ py: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Lab L13-14
        </Typography>
      </Container>
    </ThemeProvider>
  </React.StrictMode>
)
