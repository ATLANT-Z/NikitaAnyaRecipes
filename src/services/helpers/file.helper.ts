// Работа с файлами на клиенте. Класс со static-методами.
export class FileHelper {
  static readonly MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 МБ

  // Читает файл и возвращает чистый base64 (без префикса data:...;base64,).
  static toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
      reader.onload = () => {
        const result = String(reader.result)
        resolve(result.slice(result.indexOf(',') + 1))
      }
      reader.readAsDataURL(file)
    })
  }

  // Расширение файла в нижнем регистре (jpg по умолчанию).
  static ext(file: File): string {
    const dot = file.name.lastIndexOf('.')
    return dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'jpg'
  }
}
