const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { ProxyTarget, ProxyData } = require('../db/models/index')

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

// Setup steps: (refer to base project eg Proxy)
// 1. create <project> in projects
// 2. create and run project db migrations for <Project>Targets, <Project>Data
// Targets fields: url, success, freq
// Data fields: url, ...(your data)
// 3. setup specs and scraper logic in projects/<project>.js

// Run:
// source proxy
// seed target db
// start scraping with parallelization, try logic
// terminate on end or max

// seed shit and gather proxy if needed
function init() {
  const seedTarget = {
    url: spec.url,
  }

  ProxyTarget.findOrCreate({
    where: seedTarget,
  })
}

// init()

function extractData(res) {
  const usable = _.filter(res, (obj) => {
    const accept = (parseInt(obj.speed) < 2500 && obj.anonimity != 'No')
    return accept
  })

  const extracted = _.map(usable, (obj) => {
    const type = _.toLower(_.trim(_.last(_.split(obj.type, ','))))
    const ip = `${type}://${obj.ip}:${obj.port}`
    return {
      url: spec.url,
      ip,
      country: _.trim(obj.country),
      speed: parseInt(obj.speed),
      anonimity: obj.anonimity,
      usable: true,
    }
  })
  return extracted
}

function spawn() {
  const xray = xraySrc.get(spec.driver)

  xray(spec.url, spec.scope, spec.selector)
    .paginate('.proxy__pagination a@href')
    .limit(1)
    .promisify()
    .then((res) => {
      const data = extractData(res)
      log.info(_.size(data))
      log.info(JSON.stringify(data))
      _.each(data, (obj) => {
        ProxyData.create(obj)
      })
    })
}

spawn()
// !! still need to do findOrCreate

// // // still need dynamic vs not
// const x = xraySrc.get(false)
// const a = x('http://www.imdb.com/', {
//   title: ['title'],
//   links: x('.rhs-body .rhs-row', [{
//     text: 'a',
//     href: 'a@href',
//     next_page: x('a@href', {
//       title: 'title',
//       heading: 'h1'
//     })
//   }])
// })(function (err, obj) {
//   console.log(err, obj)
// })
// console.log(a)

// should defer most of crawling logic to program instead of static json spec
