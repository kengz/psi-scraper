const Promise = require('bluebird')
const _ = require('lodash')
const sts = require('stream-to-string')
const Xray = require('x-ray')
const requestDriver = require('request-x-ray')
const phantomDriver = require('x-ray-phantom')

const agents = require('../assets/proxy/agents.json')
const proxies = require('../assets/proxy/proxies.json')
const referers = require('../assets/proxy/referers.json')

const MAX_REQUEST_TIMEOUT = 20000
const MAX_REQUEST_PER_SEC = 5

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
  const options = {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': _.first(agents),
      Referer: _.first(referers),
    },
    proxy: _.first(proxies),
    timeout: MAX_REQUEST_TIMEOUT,
    webSecurity: false,
  }
  return options
}

// renew the request options by rotating assets
// return the new options
function renewOptions() {
  const options = getOptions()
  rotateAssets()
  return options
}

function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    sts(stream, (err, resStr) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(resStr))
      }
    })
  })
}

// inject a promisify function to xray using its stream()
// called xray().promisify() to return a promise
function injectWithPromisify(xray) {
  const wrapx = _.wrap(xray, (fn, urlStr, scope, selector) => {
    const initx = fn(urlStr, scope, selector)
    const promisify = function pfn() {
      return streamToPromise(initx.stream())
    }
    _.assign(initx, { promisify })
    return initx
  })
  return wrapx
}

// return a new instance of xray with options
function newXray(options, driver) {
  let xray = Xray()
    .timeout(MAX_REQUEST_TIMEOUT)
    .throttle(MAX_REQUEST_PER_SEC, '1s')
  switch (driver) {
    case 'requestjs':
      xray.driver(requestDriver(options))
      break
    case 'phantomjs':
      xray.driver(phantomDriver(options))
      break
    default:
      break
  }
  xray = injectWithPromisify(xray)
  return xray
}

// get a new instance of Xray with the current assets
function get(driver) {
  return newXray(getOptions(), driver)
}

// get a new instance of Xray with renewed assets
function renew(driver) {
  return newXray(renewOptions(), driver)
}


module.exports = {
  get,
  renew,
}
