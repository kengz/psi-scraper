const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { ProxyTarget, ProxyData } = require('../db/models/index')

const spec = {
  useProxy: false,
  dynamic: true,
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
  const xray = xraySrc.get()

  xray(spec.url, spec.scope, spec.selector)
    .paginate('.proxy__pagination a@href')
    .limit(1)
    .promisify()
    .then((res) => {
      const data = extractData(res)
      log.info(_.size(data))
      log.info(JSON.stringify(data))
      ProxyData.create(data)
    })
}

// spawn()

const data = JSON.parse('[{"url":"https://incloak.com/proxy-list/","ip":"socks4://5.223.148.9:1080","country":"Iran  Sari","speed":900,"anonimity":"High","usable":true},{"url":"https://incloak.com/proxy-list/","ip":"socks5://72.2.151.178:45554","country":"United States  Rolling Prairie","speed":2180,"anonimity":"High","usable":true}]')

ProxyData.create(data[0])

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
