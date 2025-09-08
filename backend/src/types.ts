export interface UHRPRecord {
 protocolAddress: string
 hashBytes: number[]
 uhrpURL: string
 expirySecs: number
 size: number
}

export interface UTXOReference {
  txid: string
  outputIndex: number
}
