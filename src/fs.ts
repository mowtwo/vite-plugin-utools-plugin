import fs from 'node:fs/promises'

export const dirPathExisted = (target: string) =>
  fs.stat(target)
    .then(s =>
      s.isDirectory()
    )
    .catch(() => false)

export const filePathExisted = (target: string) =>
  fs.stat(target)
    .then(s =>
      s.isFile()
    )
    .catch(() => false)
