class StorageFileIoService {
  private let storageFileIo = StorageFileIo()

  func readFile(path: String, skipIfNotExist: Bool?) -> String? {
    do {
      return try storageFileIo.readFile(path: path, skipIfNotExist: skipIfNotExist)
    } catch {
      logger.error("readFile failed: \(error)")
      return nil
    }
  }
  func writeFile(path: String, content: String, append: Bool?) -> Bool {
    do {
      try storageFileIo.writeFile(path: path, content: content, append: append)
      return true
    } catch {
      logger.error("writeFile failed: \(error)")
      return false
    }
  }
  func deleteFile(path: String) -> Bool {
    do {
      try storageFileIo.deleteFile(path: path)
      return true
    } catch {
      logger.error("deleteFile failed: \(error)")
      return false
    }
  }
}
