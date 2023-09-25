/* eslint-disable prefer-arrow/prefer-arrow-functions, no-var, @typescript-eslint/no-unused-vars, no-caller, @typescript-eslint/explicit-module-boundary-types */

declare const dump: (msg: string) => void
declare const Components: any
declare const ChromeUtils: any
declare var Services: any
const {
  interfaces: Ci,
  results: Cr,
  utils: Cu,
  Constructor: CC,
} = Components

var stylesheetID = 'date-from-last-modified-stylesheet'
var ftlID = 'date-from-last-modified-ftl'
var menuitemID = 'make-it-green-instead'

if (typeof Zotero == 'undefined') {
  var Zotero
}

function log(msg) {
  msg = `bDFLM: ${msg}`
  if (typeof Zotero === 'undefined') {
    dump(`${msg}\n`)
  }
  else {
    Zotero.debug(msg)
  }
}

// In Zotero 6, bootstrap methods are called before Zotero is initialized, and using include.js
// to get the Zotero XPCOM service would risk breaking Zotero startup. Instead, wait for the main
// Zotero window to open and get the Zotero object from there.
//
// In Zotero 7, bootstrap methods are not called until Zotero is initialized, and the 'Zotero' is
// automatically made available.
async function waitForZotero() {
  if (typeof Zotero != 'undefined') {
    await Zotero.initializationPromise
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm')
  var windows = Services.wm.getEnumerator('navigator:browser')
  var found = false
  while (windows.hasMoreElements()) {
    const win = windows.getNext()
    if (win.Zotero) {
      Zotero = win.Zotero
      found = true
      break
    }
  }
  if (!found) {
    await new Promise(resolve => {
      var listener = {
        onOpenWindow(aWindow) {
          // Wait for the window to finish loading
          const domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow)
          domWindow.addEventListener('load', function() {
            domWindow.removeEventListener('load', arguments.callee, false)
            if (domWindow.Zotero) {
              Services.wm.removeListener(listener)
              Zotero = domWindow.Zotero
              resolve(undefined)
            }
          }, false)
        },
      }
      Services.wm.addListener(listener)
    })
  }
  await Zotero.initializationPromise
}


// Loads default preferences from prefs.js in Zotero 6
function setDefaultPrefs(rootURI) {
  var branch = Services.prefs.getDefaultBranch('')
  var obj = {
    pref(pref, value) {
      switch (typeof value) {
        case 'boolean':
          branch.setBoolPref(pref, value)
          break
        case 'string':
          branch.setStringPref(pref, value)
          break
        case 'number':
          branch.setIntPref(pref, value)
          break
        default:
          Zotero.logError(`Invalid type '${typeof(value)}' for pref '${pref}'`)
      }
    },
  }
  Services.scriptloader.loadSubScript(`${rootURI  }prefs.js`, obj)
}


export async function install() {
  await waitForZotero()

  log('Installed')
}

export async function startup({ id, version, resourceURI, rootURI = resourceURI.spec }) {
  await waitForZotero()

  log(`Startup: ${typeof Zotero}`)
  try {
    Services.scriptloader.loadSubScript(`${rootURI}lib.js`, { Zotero })
    Zotero.DateFromLastModified.install()
  }
  catch (err) {
    log(`${err}: ${err.stack}`)
  }
  log('started')
}

export function shutdown() {
  log('Shutting down')

  Zotero.DateFromLastModified.uninstall()
  Zotero.DateFromLastModified = undefined
}

export function uninstall() {
  log('Uninstalled')
}
