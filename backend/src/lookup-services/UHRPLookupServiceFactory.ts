import { AdmissionMode, LookupService, OutputAdmittedByTopic, OutputSpent, SpendNotificationMode } from '@bsv/overlay'
import { PushDrop, Utils, StorageUtils } from '@bsv/sdk'
import { UHRPRecord, UTXOReference } from '../types.js'
import { Db, Collection } from 'mongodb'
import uhrpLookupDocs from './UHRPLookupDocs.md'

class UHRPLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'
  records: Collection<UHRPRecord>

  constructor(db: Db) {
    this.records = db.collection<UHRPRecord>('uhrp')
  }

  async getDocumentation(): Promise<string> {
    return uhrpLookupDocs
  }

  async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
    return {
      name: 'UHRP Lookup Service',
      shortDescription: 'Lookup Service for User file hosting commitment tokens'
    }
  }

  async outputAdmittedByTopic(payload: OutputAdmittedByTopic) {
    if (payload.mode !== 'locking-script') throw new Error('Invalid payload')
    const { topic, txid, outputIndex, lockingScript } = payload
    if (topic !== 'tm_uhrp') return

    // Decode UHRP token fields
    const decoded = PushDrop.decode(lockingScript)
    const fields = decoded.fields
    const protocolAddress = Utils.toUTF8(Utils.toArray(fields[0]))
    const hashBytes = Array.from(fields[1])
    const uhrpURL = Utils.toUTF8(Utils.toArray(fields[2]))
    const expirySecs = Number(Utils.toUTF8(Utils.toArray(fields[3])))
    const size = Number(Utils.toUTF8(Utils.toArray(fields[4])))

    // Derive a convenient hex key for lookups
    const hashHex = Buffer.from(hashBytes).toString('hex')

    // Store UHRP fields in MongoDB (include txid/outputIndex for reverse lookups)
    await (this.records as unknown as Collection<any>).updateOne(
      { txid, outputIndex },
      {
        $set: {
          txid,
          outputIndex,
          protocolAddress,
          hashBytes,
          hashHex,
          uhrpURL,
          expirySecs,
          size,
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
  }

  async outputSpent(payload: OutputSpent) {
    if (payload.mode !== 'none') throw new Error('Invalid payload')
    const { topic, txid, outputIndex } = payload
    if (topic !== 'tm_uhrp') return

    // Remove spent commitment
    await (this.records as unknown as Collection<any>).deleteOne({ txid, outputIndex })
  }

  async outputEvicted(txid: string, outputIndex: number) {
    // Remove evicted commitment
    await (this.records as unknown as Collection<any>).deleteOne({ txid, outputIndex })
  }

  async lookup({ query }: any): Promise<UTXOReference[]> {
    // Validate query
    if (!query) throw new Error('A valid query must be provided')

    const nowSecs = Math.floor(Date.now() / 1000)

    // Handle simple queries
    if (query === 'all') {
      const docs = await (this.records as unknown as Collection<any>)
        .find({}, { projection: { _id: 0, txid: 1, outputIndex: 1 } })
        .toArray()
      return docs as UTXOReference[]
    }

    if (query === 'active') {
      const docs = await (this.records as unknown as Collection<any>)
        .find({ expirySecs: { $gt: nowSecs } }, { projection: { _id: 0, txid: 1, outputIndex: 1 } })
        .toArray()
      return docs as UTXOReference[]
    }

    // Object queries
    if (typeof query === 'object') {
      if (query.type === 'byUrl' && typeof query.value === 'string') {
        const doc = await (this.records as unknown as Collection<any>).findOne(
          { uhrpURL: query.value },
          { projection: { _id: 0, txid: 1, outputIndex: 1 } }
        )
        return doc ? ([doc] as UTXOReference[]) : []
      }
      if (query.type === 'byHashHex' && typeof query.value === 'string') {
        const doc = await (this.records as unknown as Collection<any>).findOne(
          { hashHex: query.value.toLowerCase() },
          { projection: { _id: 0, txid: 1, outputIndex: 1 } }
        )
        return doc ? ([doc] as UTXOReference[]) : []
      }
    }

    // Unknown query
    return []
  }
}

export default (db: Db) => new UHRPLookupService(db)
