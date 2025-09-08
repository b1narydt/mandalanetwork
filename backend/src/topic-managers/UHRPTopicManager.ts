import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import { Transaction, PushDrop, Utils } from '@bsv/sdk'
import uhrpTopicDocs from './UHRPTopicDocs.md'

export default class UHRPTopicManager implements TopicManager {
  identifyNeededInputs?: ((beef: number[]) => Promise<Array<{ txid: string; outputIndex: number }>>) | undefined

  /**
   * Get the documentation associated with this topic manager
   * @returns A promise that resolves to a string containing the documentation
   */
  async getDocumentation(): Promise<string> {
    return uhrpTopicDocs
  }

  /**
   * Get metadata about the topic manager
   * @returns A promise that resolves to an object containing metadata
   * @throws An error indicating the method is not implemented
   */
  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'Universal Hash Resolution Protocol',
      shortDescription: 'Manages UHRP content availability advertisements.'
    }
  }

  /**
   * Identify if the outputs are admissible depending on the particular protocol requirements
   * @param beef - The transaction data in BEEF format
   * @param previousCoins - The previous coins to consider
   * @returns A promise that resolves with the admittance instructions
   */
  async identifyAdmissibleOutputs(beef: number[], previousCoins: number[]): Promise<AdmittanceInstructions> {
    try {
      console.log('previous UTXOs', previousCoins.length)
      const outputs: number[] = []
      const parsedTransaction = Transaction.fromBEEF(beef)

      for (const [i, output] of parsedTransaction.outputs.entries()) {
        try {
          // TODO 1: Decode UHRP token
          const decoded = PushDrop.decode(output.lockingScript)
          const fields = decoded.fields
          // Example access (actual schema validation TBD):
          // const protocolAddr = Utils.toUTF8(Utils.toArray(fields[0]))
          // const hashBytes = fields[1]
          // const urlOrUhrp = Utils.toUTF8(Utils.toArray(fields[2]))
          // const expiry = Number(Utils.toUTF8(Utils.toArray(fields[3])))
          // const size = Number(Utils.toUTF8(Utils.toArray(fields[4])))

          // TODO 2: Validate token fields
          // Add minimal sanity checks or leave to LookupService validation

          outputs.push(i)
        } catch (error) {
          console.error('Error with output', i, error)
        }
      }

      if (outputs.length === 0) {
        throw new Error('This transaction does not publish a valid UHRP token!')
      }

      return {
        coinsToRetain: previousCoins,
        outputsToAdmit: outputs
      }
    } catch (error) {
      return {
        coinsToRetain: [],
        outputsToAdmit: []
      }
    }
  }
}
