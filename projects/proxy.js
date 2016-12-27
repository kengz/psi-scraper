const Promise = require('bluebird')
const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { ProxyTarget, ProxyData, sequelize } = require('../db/models/index')

const spec = {
  useProxy: false,
  driver: null,
  url: 'https://incloak.com/proxy-list/',
  scope: '.proxy__t tr',
  selector: [{
    ip: 'td:nth-child(1)',
    port: 'td:nth-child(2)',
    country: 'td:nth-child(3)',
    speed: 'td:nth-child(4)',
    type: 'td:nth-child(5)',
    anonimity: 'td:nth-child(6)',
  }],
}

// seed targets and start proxy project if needed
function init() {
  const seedTarget = {
    url: spec.url,
  }
  return ProxyTarget.findOrCreate({ where: seedTarget })
}

// extract data for db from xray result
function extractData(res) {
  const usable = _.filter(res, (obj) => {
    const accept = (parseInt(obj.speed, 10) < 2500 && obj.anonimity !== 'No')
    return accept
  })

  const extracted = _.map(usable, (obj) => {
    const type = _.toLower(_.trim(_.last(_.split(obj.type, ','))))
    const ip = `${type}://${obj.ip}:${obj.port}`
    return {
      url: spec.url,
      ip,
      country: _.trim(obj.country),
      speed: parseInt(obj.speed, 10),
      anonimity: obj.anonimity,
      usable: true,
    }
  })
  return extracted
}

// create and run an instance of xray
function spawn() {
  log.info('spawning')
  const xray = xraySrc.get(spec.driver)

  return xray(spec.url, spec.scope, spec.selector)
    .paginate('.proxy__pagination a@href')
    .limit(20)
    .promisify()
    .then((res) => {
      const data = extractData(res)
      const promises = _.map(data, (proxy) => {
        return ProxyData.findOrCreate({ where: proxy })
      })
      return Promise.all(promises)
    })
}

init()
  .then(spawn)
  .then(() => {
    console.log('done')
    sequelize.close()
  })

// ProxyData.destroy({where: {}})
// sequelize.close()
