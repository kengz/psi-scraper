# psi-scraper
The Ion Cannon for scraper, with json configs, proxy, Gulp build system, parallelization, Sequelize data model.


## Installation

1. clone this repo
2. install dependencies with `npm run setup` (this runs `npm i` too)
3. setup `config/`
4. run with `npm start`


## Development

#### Test

```shell
npm test
```

#### ESLint

```shell
npm run lint
```

## Roadmap

- [x] data model and migration for VisitedLinks
- [ ] start the basic scraper
- [ ] devise config format for HTML targets patterns, target path patterns, advanced behavior assets
- [ ] gulp process control
- [ ] proper exit for `forever`
- [ ] scrape Flyertalk forum as first target

