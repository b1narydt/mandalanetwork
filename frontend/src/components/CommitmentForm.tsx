import {
  Fab, DialogActions, Container, Typography, Box, Grid,
  Dialog, DialogContent, DialogContentText, LinearProgress, Button, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { useState, FormEvent, ChangeEvent } from 'react'
import { publishCommitment } from '../utils/publishCommitment'

const CommitmentForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [fileURL, setFileURL] = useState<string>('')
  const [hostingTime, setHostingTime] = useState<number>(180)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [formLoading, setFormLoading] = useState<boolean>(false)
  const [useURL, setUseURL] = useState<boolean>(false)
  const hostingURL = 'https://nanostore.babbage.systems'
  const [committedURL, setCommittedURL] = useState<string | null>(null)

  const DURATION_OPTIONS: Record<string, number> = {
    '15 Minutes': 15,
    '3 Hours': 180,
    '1 Day': 1440,
    '1 Week': 1440 * 7,
    '1 Month': 1440 * 30,
    '3 Months': 1440 * 90,
    '6 Months': 1440 * 180,
    '1 Year': 525600,
    '2 Years': 525600 * 2,
    '5 Years': 525600 * 5,
    '10 Years': 525600 * 10
  }

  // TODO 1: Handle file input changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
  }

  // TODO 2: Handle form submission
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormLoading(true)
    setCommittedURL(null)
    try {
      const uhrpURL = await publishCommitment({
        hostingMinutes: hostingTime,
        serviceURL: hostingURL,
        url: useURL ? fileURL : undefined,
        file: useURL ? undefined : file || undefined
      })
      // TEMP: Log the generated UHRP URL for debugging/verification
      console.log('[CommitmentForm] UHRP URL created:', uhrpURL)
      setCommittedURL(uhrpURL)
      setFormOpen(false)
      setFile(null)
      setFileURL('')
    } catch (err) {
      console.error('Publish failed:', err)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box mt={5} p={3} border={1} borderRadius={4} borderColor="grey.300">
        <Typography variant="h4" gutterBottom>
          Create File Storage Commitment
        </Typography>
        <Fab color="primary" onClick={() => setFormOpen(true)}>
          <AddIcon />
        </Fab>
        <Grid>
          <Dialog open={formOpen} onClose={() => setFormOpen(false)}>
            <form onSubmit={handleFormSubmit}>
              <DialogContent>
                <DialogContentText paragraph>
                  {useURL
                    ? 'Enter the URL of the file and specify the hosting time.'
                    : 'Upload a file and specify the hosting time to create a file storage commitment.'}
                </DialogContentText>
                <Button
                  variant="outlined"
                  onClick={() => setUseURL(!useURL)}
                  style={{ marginBottom: '16px' }}
                >
                  {useURL ? 'Switch to File Upload' : 'Switch to URL Input'}
                </Button>
                {useURL ? (
                  <TextField
                    label="File URL"
                    fullWidth
                    margin="normal"
                    onChange={(e) => setFileURL(e.target.value)}
                    value={fileURL}
                    required
                  />
                ) : (
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    style={{ display: 'block', marginBottom: '16px' }}
                  />
                )}
                <FormControl fullWidth margin="normal">
                  <InputLabel id="duration-label">Duration</InputLabel>
                  <Select
                    labelId="duration-label"
                    label="Duration"
                    value={hostingTime}
                    onChange={(e) => setHostingTime(Number(e.target.value))}
                  >
                    {Object.entries(DURATION_OPTIONS).map(([label, value]) => (
                      <MenuItem key={label} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              {formLoading ? (
                <LinearProgress />
              ) : (
                <DialogActions>
                  <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button type="submit" color="primary">
                    Submit
                  </Button>
                </DialogActions>
              )}
            </form>
          </Dialog>
        </Grid>

        {/* TODO 3: Display published UHRP URL */}
        {committedURL && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              UHRP URL
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              <a href={committedURL} target="_blank" rel="noopener noreferrer">
                {committedURL}
              </a>
            </Typography>
          </Box>
        )}

      </Box>
    </Container>
  )
}

export default CommitmentForm