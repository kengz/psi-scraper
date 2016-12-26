const Promise = require('bluebird')
const _ = require('lodash')
const Xray = require('x-ray')
const requestDriver = require('request-x-ray')

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

// get the current request optoins
function getOptions() {
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
  return options
}

// renew the request options by rotating assets
// return the new options
function renewOptions() {
  const options = getOptions()
  rotateAssets()
  return options
}

// return a new instance of xray with options
function newXray(options) {
  const xray = Xray()
    .driver(requestDriver(options))
    .timeout(MAX_REQUEST_TIMEOUT)
  return xray
}

// return a new instance of async xray
function newXrayAsync(xray) {
  const xrayAsync = function wrapper(url, selector) {
    return new Promise((resolve, reject) => {
      xray(url, selector)((err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
  return xrayAsync
}

// get a new instance of Xray async with the current assets
function get() {
  const xray = newXray(getOptions())
  const xrayAsync = newXrayAsync(xray)
  return xrayAsync
}

// get a new instance of Xray async with renewed assets
function renew() {
  const xray = newXray(renewOptions())
  const xrayAsync = newXrayAsync(xray)
  return xrayAsync
}


module.exports = {
  get,
  renew,
}
