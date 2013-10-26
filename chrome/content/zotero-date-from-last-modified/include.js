// Only create main object once
if (!Zotero.DateFromLastModified) {
	let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://zotero-date-from-last-modified/content/zotero-date-from-last-modified.js");
}
