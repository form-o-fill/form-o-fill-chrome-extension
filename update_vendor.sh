#!/bin/bash
# Updates:
# moment.js
# chance.js
#
curl -o src/vendor/moment.js/moment-with-locales.min.js -LO "https://momentjs.com/downloads/moment-with-locales.min.js" 
curl -o src/vendor/chance.js/chance.js -LO "https://raw.githubusercontent.com/chancejs/chancejs/master/dist/chance.min.js"
curl -o src/vendor/optimal-select/optimal-select.js -LO "https://raw.githubusercontent.com/Autarc/optimal-select/master/dist/optimal-select.min.js"
