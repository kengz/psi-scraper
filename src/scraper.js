const Promise = require('bluebird')
const Xray = require('x-ray')
const requestDriver = require('request-x-ray')
const log = require('./log')
const requestOptions = require('./request-options')

// also need to keep all data at all flow

// need:
// target url generator
// for each target (group), the selector pattern
// also per group, the failure pattern and retry strategy
// crawling pttern since I can crawl directly now
// merge param and DB model

// component for Ion Cannon:
// target generator: url and selector
// recursively defined: crawler logic on target
// failure patterns, and retry mechanism
// success patterns and data storage. DB model
// proxy logic and refresh mechanism
// parallelization and running control

// need header, at the final stage we were using plain
// request with the header for scraping whole body,
// then pass the body to xray only for parsing
// maybe this? https://github.com/Crazometer/request-x-ray

// const param = {
//   dynamic: true,
//   url: 'http://www.imdb.com/',
//   selector: 'a',
// }

// _.sample

const options = requestOptions.renew()
// http://www.flyertalk.com/forum/
const xray = Xray()
  .driver(requestDriver(options))


// function handler(err, res) {
//   console.log(res) // Google
// }
// xray('http://google.com', 'title')(handler).then(function(r) {
//   console.log(r)
// })

function xrayAsync(url, selector) {
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

const url = 'http://www.flyertalk.com/forum/'
const selector = ['.alt1Active a@href']
xrayAsync(url, selector)
  .then((res) => {
    log.info(JSON.stringify(res))
  })

// // crawler eg
// const Xray = require('x-ray')
// const x = Xray()

// x('http://www.imdb.com/', {
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

// should defer most of crawling logic to program instead of static json spec
