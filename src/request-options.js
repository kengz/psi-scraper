const _ = require('lodash')

const agents = require('../assets/proxy/agents.json')
const proxies = require('../assets/proxy/proxies.json')
const referers = require('../assets/proxy/referers.json')

const MAX_REQUEST_TIMEOUT = 15000

// rotate all assets: take the first and put to the last
function rotateAssets() {
  _.each([agents, proxies, referers], (asset) => {
    if (!_.isEmpty(asset)) {
      asset.push(asset.shift())
    }
  })
}

// renew the request options by rotating assets
function renew() {
  const options = _.pickBy({
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': _.first(agents),
      Referer: _.first(referers),
    },
    proxy: _.first(proxies),
    timeout: MAX_REQUEST_TIMEOUT,
  })

  rotateAssets()
  return options
}


module.exports = {
  renew,
}
