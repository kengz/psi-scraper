const log = require('./log')
const xraySrc = require('./xray-src')

// also need to keep all data at all flow

// change first target to proxy gatherer
// component for Ion Cannon:
// asset generator: add proxy gatherer - vital for self-sustenance
// use the cannon itself to gather proxy
// design high level param and data model
// target generator: url and selector
// recursively defined: crawler logic on target
// failure patterns, and retry mechanism
// success patterns and data storage. DB model
// proxy logic and refresh mechanism
// parallelization and running control


// const param = {
//   dynamic: true,
//   url: 'http://www.imdb.com/',
//   selector: 'a',
// }

const xray = xraySrc.get()
// const url = 'http://www.flyertalk.com/forum/'
const url = 'http://www.imdb.com/'
// const selector = ['.alt1Active a@href']
const selector = ['title']

xray(url, selector).promisify().then((res) => {
  log.info(JSON.stringify(res))
})

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
