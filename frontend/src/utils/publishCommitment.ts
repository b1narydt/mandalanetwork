import WalletClient from '@bsv/sdk/wallet/WalletClient'
import { StorageUploader } from '@bsv/sdk/storage/StorageUploader'
import { PushDrop, Utils } from '@bsv/sdk'

export interface PublishCommitmentParams {
  hostingMinutes: number
  serviceURL?: string
  url?: string
  file?: File
}

// Uploads content to UHRP storage and returns the UHRP URL
export async function publishCommitment({
  hostingMinutes,
  serviceURL = 'https://nanostore.babbage.systems',
  url,
  file
}: PublishCommitmentParams): Promise<string> {
  // Initialize WalletClient (auto substrate, localhost by default)
  const wallet = new WalletClient('auto', 'localhost')

  // Create StorageUploader instance
  const storageUploader = new StorageUploader({
    storageURL: serviceURL,
    wallet
  })

  // Obtain bytes and metadata either from URL or File
  let data: number[]
  let type = 'application/octet-stream'
  let size = 0

  if (file) {
    const buf = await file.arrayBuffer()
    data = Array.from(new Uint8Array(buf))
    type = file.type || type
    size = file.size
  } else if (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`)
    const buf = await res.arrayBuffer()
    data = Array.from(new Uint8Array(buf))
    // Try to use content-type header if present
    const hdrType = res.headers.get('content-type')
    if (hdrType) type = hdrType
    size = buf.byteLength
  } else {
    throw new Error('Either file or url must be provided')
  }

  const fileObject = { data, type, size }
  const result = await storageUploader.publishFile({
    file: fileObject,
    retentionPeriod: hostingMinutes
  })
  // publishFile returns synchronously with { uhrpURL }
  const uhrpURL = result.uhrpURL

  // TODO 7: Create a PushDrop token and publish on-chain action
  // Fields:
  // 0: Protocol address (string)
  // 1: SHA256 hash (32 bytes)
  // 2: Hosted file URL (HTTPS)
  // 3: Expiry time (Unix timestamp seconds)
  // 4: File size (bytes)

  // Compute SHA-256 of the uploaded content
  const bufferForHash = new Uint8Array(data).buffer
  const hashBuf = await crypto.subtle.digest('SHA-256', bufferForHash)
  const hashBytes = Array.from(new Uint8Array(hashBuf))

  const expirySecs = Math.floor(Date.now() / 1000) + hostingMinutes * 60
  const protocolAddress = '1UHRPYnMHPuQ5Tgb3AF8JXqwKkmZVy5hG'

  const pushdrop = new PushDrop(wallet)
  const lockingScript = await pushdrop.lock(
    [
      Utils.toArray(protocolAddress),
      hashBytes,
      Utils.toArray(uhrpURL),
      Utils.toArray(String(expirySecs)),
      Utils.toArray(String(size))
    ],
    [1, 'UHRP Commitment'],
    '1',
    'self',
    true,
    false,
    'before'
  )

  // Create the on-chain action with 1 sat PushDrop output
  await wallet.createAction({
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'publishcommitment',
        tags: ['tm_uhrp']
      }
    ],
    options: { randomizeOutputs: false, acceptDelayedBroadcast: false },
    labels: ['publishcommitment'],
    description: 'publishcommitment'
  })

  return uhrpURL
}
