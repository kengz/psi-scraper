const log = require('./log')
const xraySrc = require('./xray-src')

// also need to keep all data at all flow

// component for Ion Cannon:
// asset generator: add proxy gatherer - vital for self-sustenance
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


const xrayAsync = xraySrc.getAsync()

const url = 'http://www.flyertalk.com/forum/'
const selector = ['.alt1Active a@href']
xrayAsync(url, selector)
  .then((res) => {
    log.info(JSON.stringify(res))
  })


// // still need dynamic vs not
// const x = xraySrc.get(false)
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
