import { expect } from "chai"

export abstract class CommonUtil {
  public static expectThrowsAsync = async (method: () => Promise<any>, errorMessage?: string) => {
    let error: any
    try {
      await method()
    }
    catch (err) {
      error = err
    }
    expect(error).to.not.be.undefined
    if (errorMessage) {
      expect(error.message).to.equal(errorMessage)
    }
    return error
  }
}