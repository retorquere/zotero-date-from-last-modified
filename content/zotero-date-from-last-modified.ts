declare const Zotero: any

export const DateFromLastModified = Zotero.DateFromLastModified || new class { // tslint:disable-line:variable-name
  private initialized = false

  constructor() {
    window.addEventListener('load', _event => {
      // Register the callback in Zotero as an item observer
      const notifierID = Zotero.Notifier.registerObserver(this, ['item'])

      // Unregister callback when the window closes (important to avoid a memory leak)
      window.addEventListener('unload', () => {
        Zotero.Notifier.unregisterObserver(notifierID)
      }, false)

    }, false)
  }

  public notify(event, type, ids, extraData) {
    this.notifyAsync(event, type, ids, extraData).catch((err: Error) => {
      Zotero.logError(err)
    })
  }

  private formatDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date)) return ''
    const year = date.getFullYear()
    if (typeof year === 'undefined') return ''

    return `${year}-${(date.getMonth()) + 1}-${date.getDate()}`
  }

  private async notifyAsync(event, type, ids, _extraData) {
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
}
