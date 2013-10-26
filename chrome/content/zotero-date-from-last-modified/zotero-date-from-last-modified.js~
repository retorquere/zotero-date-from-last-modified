Zotero.DateFromLastModified = {
  init: function () {
    // Register the callback in Zotero as an item observer
    var notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, ['item']);

    console.log('grabbing web dates');
    
    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
  },
  
  // Callback implementing the notify() method to pass to the Notifier
  notifierCallback: {
    notify: function(event, type, ids, extraData) {
      console.log(event);
      if (event == 'add' || event == 'modify') {
        var items = Zotero.Items.get(ids);
        var item, url, date;

        for (item of items) {
          url = item.getField('url');
          date = item.getField('date');
          console.log('url=' + url, ', date=' + date);
          if (url && !date) {
            var req = new XMLHttpRequest();
            req.open('GET', url, false);
            req.send(null);
            if (req.status == 200) {
              date = req.getResponseHeader("Last-Modified");
              if (date && date != '') {
                try {
                  date = new Date(date);
                  date = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                  item.setField('date', date);
                  item.save();
                } catch (err) {
                  console.log('Could not set date "' + date + '": ' + err);
                }
              }
            }
          }
        }
      }
    }
  }
};

// Initialize the utility
window.addEventListener('load', function(e) { Zotero.DateFromLastModified.init(); }, false);
