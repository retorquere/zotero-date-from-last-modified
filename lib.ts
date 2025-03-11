declare const Zotero: any
declare const Components: any
const {
  // classes: Cc,
  // interfaces: Ci,
  utils: Cu,
} = Components

if (Zotero.platformMajorVersion < 102) {
  Cu.importGlobalProperties(['URL'])
}

Zotero.DateFromLastModified = new class {
  private notifierID: number

  constructor() {
    this.log('starting up')
  }

  log(msg) {
    Zotero.debug(`last-modified: ${JSON.stringify(msg)}`)
  }

  install() {
    this.notifierID = Zotero.Notifier.registerObserver(this, ['item'])
  }

  uninstall() {
    Zotero.Notifier.unregisterObserver(this.notifierID)
  }

  public async notify(event, type, ids, _extraData) {
    this.log({event, type, ids})
    if (event !== 'add' && event !== 'modify') return

    const items = await Zotero.Items.getAsync(ids)
    const today = this.formatDate(new Date())

    for (const item of items) {
      const url = item.getField('url')
      const date = item.getField('date')
      if (!url || date) continue

      try {
        const xhr: XMLHttpRequest = await Zotero.HTTP.request('GET', url)
        const lastModified = this.formatDate(new Date(xhr.getResponseHeader('Last-Modified')))
        if (lastModified && lastModified !== today) {
          item.setField('date', lastModified)
          await item.saveTx()
        }
      }
      catch (err) {
        Zotero.logError(err)
      }
    }
  }

  private formatDate(date: Date) {
    // if (!(date instanceof Date) || isNaN(date)) return ''
    if (!(date instanceof Date)) return ''
    const year = date.getFullYear()
    if (typeof year === 'undefined') return ''

    return `${year}-${(date.getMonth()) + 1}-${date.getDate()}`
  }
}
