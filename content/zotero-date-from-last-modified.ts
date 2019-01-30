declare const Zotero: any
declare const Components: any

const marker = 'DateFromLastModifiedMonkeyPatched'

function patch(object, method, patcher) {
  if (object[method][marker]) return
  object[method] = patcher(object[method])
  object[method][marker] = true
}

export let DateFromLastModified = Zotero.DateFromLastModified || new class { // tslint:disable-line:variable-name
  private initialized: boolean = false

  constructor() {
    window.addEventListener('load', event => {
      // Register the callback in Zotero as an item observer
      const notifierID = Zotero.Notifier.registerObserver(this, ['item'])

      // Unregister callback when the window closes (important to avoid a memory leak)
      window.addEventListener('unload', () => {
        Zotero.Notifier.unregisterObserver(notifierID)
      }, false)

    }, false)
  }

  public notify(event, type, ids, extraData) {
    this.notifyAsync(event, type, ids, extraData).catch(err => Zotero.logError(err))
  }

  private formatDate(date) {
    if (!date) return ''
    const year = date.getFullYear()
    if (typeof year === 'undefined') return ''

    return `${year}-${date.getMonth() + 1}-${date.getDate()}`
  }

  private async notifyAsync(event, type, ids, extraData) {
    if (event !== 'add' && event !== 'modify') return

    const items = await Zotero.Items.getAsync(ids)
    const today = this.formatDate(new Date())

    for (const item of items) {
      const url = item.getField('url')
      const date = item.getField('date')
      if (!url || date) continue

      try {
        const xhr = await Zotero.HTTP.request('GET', url)
        const lastModified = this.formatDate(xhr.getResponseHeader('Last-Modified'))
        if (lastModified && lastModified !== today) {
          item.setField('date', lastModified)
          await item.saveTx()
        }
      } catch (err) {
        Zotero.logError(err)
      }
    }
  }
}
