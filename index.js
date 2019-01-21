const { name } = require('./package.json')
const nunjucks = require('nunjucks')
const path = require('path')

const nunjucksDefaults = {
  autoescape: false,
  watch: false
}

const CONFIG = Object.assign({}, nunjucksDefaults, hexo.config.nunjucks)

const builtInFilters = [
  require('./filters/cast-array'),
  require('./filters/base-url'),
  require('./filters/prop'),
  require('./filters/typeOf'),
  require('./filters/xmlattr')
]
  .map(filter => ({
    name: toSnakeCase(filter.name),
    handler: filter,
    async: filter.async
  }))

hexo.log.info('[%s] %d filters loaded', name, builtInFilters.length)

function toSnakeCase (str = '') {
  return str.replace(/[A-Z]/g, (matched) => '_' + matched.toLowerCase())
}

function installFilters (env, filter) {
  env.addFilter(toSnakeCase(filter.name), filter.handler, filter.async)
}

function njkCompile (data) {
  const templateDir = path.dirname(data.path)
  const env = nunjucks.configure(templateDir, CONFIG)
  builtInFilters.forEach(filter => installFilters(env, filter))
  const njkTemplate = nunjucks.compile(data.text, env)
  return function renderer (locals) {
    try {
      return njkTemplate.render(locals)
    } catch (e) {
      hexo.log.error(e)
    }
    return ''
  }
}

function njkRenderer (data, locals) {
  return njkCompile(data)(locals)
}

njkRenderer.compile = njkCompile

/* global hexo */
hexo.extend.renderer.register('j2', 'html', njkRenderer, true)
hexo.extend.renderer.register('njk', 'html', njkRenderer, true)
hexo.extend.renderer.register('nunjucks', 'html', njkRenderer, true)
