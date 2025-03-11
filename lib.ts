declare const Zotero: any
declare const Components: any
const {
  // classes: Cc,
  // interfaces: Ci,
  utils: Cu,
} = Components

if (Zotero.platformMajorVersion < 102) {
  Cu.importGlobalProperties(['fetch', 'URL'])
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

  async update(id: number) {
    const item = await Zotero.Items.getAsync(id)
    if (item.isFeedItem || !item.isRegularItem()) return

    const types = (Zotero.Prefs.get('date-from-last-modified.itemtypes') || '').trim().toLowerCase().split(/\s*,\s*/)
    if (types.length && !types.includes(Zotero.ItemTypes.getName(item.itemTypID))) return

    const url: string = item.getField('url', false, true)
    const date: string = item.getField('date', false, true)
    this.log(JSON.stringify({ url, date }))
    if (!url || date) return

    this.log(`getting lastModified from ${url}`)

    const result = await fetch(url)
    const lastModified = this.formatDate(new Date(result.headers.get('Last-Modified')))
    this.log(`lastModified=${lastModified}`)

    const today = this.formatDate(new Date())
    if (lastModified && lastModified !== today && lastModified !== '1970-1-1') {
      item.setField('date', lastModified)
      this.log(`setting ${item.itemID} ${lastModified}`)
      await item.saveTx()
    }
  }

  uninstall() {
    Zotero.Notifier.unregisterObserver(this.notifierID)
  }

  public notify(event: string, type: string, ids: number[], _extraData) {
    this.log(JSON.stringify({ event, type, ids }))
    if (event !== 'add' && event !== 'modify') return

    for (const id of ids) {
      void this.update(id)
    }
  }

  private formatDate(date: Date) {
    // if (!(date instanceof Date) || isNaN(date)) return ''
    if (!(date instanceof Date)) return ''
    const year = date.getFullYear()
    if (typeof year === 'undefined') return ''

    const formatted = date.toISOString().replace(/T.*/, '')
    if (formatted === '1970-01-01' || formatted === (new Date).toISOString().replace(/T.*/, '')) return ''
    return formatted.replace(/-0/g, '-')
  }
}
