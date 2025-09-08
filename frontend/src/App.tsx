import React from 'react'
import { Container, Stack, Typography, Card, CardContent } from '@mui/material'
import CommitmentForm from './components/CommitmentForm'

export default function App() {
  return (
    <Container maxWidth="md" className="app-container">
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700} textAlign="center">
          Lab L13-14: Publish Commitment
        </Typography>
        <Card className="card">
          <CardContent>
            <CommitmentForm />
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
