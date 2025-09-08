import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00e5ff' },
    secondary: { main: '#7c4dff' },
    background: { default: '#0b0f17', paper: '#101521' },
    text: { primary: '#e6f1ff', secondary: '#9db2d1' }
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 10 }
})

export default theme
