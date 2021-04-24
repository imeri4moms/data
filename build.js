import front from 'front-matter'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

;(async () => {
  try {
    const items = {
      delivery: delivery,
      products: products,
    }

    for (const i in items) {
      await fs.mkdir(`./public/${i}`)
      const data = await items[i]()
      await fs.writeFile(`./public/${i}/index.json`, JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.error(err)
  }
})()

async function delivery() {
  const index = yaml.load(await read('./delivery/index.yml'))

  const locales = {}
  const files = await fs.readdir('./delivery/locales/')
  for (const f of files) {
    locales[path.parse(f).name] = yaml.load(await read('./delivery/locales/' + f))
  }

  const title = id =>
    Object.keys(locales).reduce(
      (res, loc) => ({
        ...res,
        [loc]: locales[loc][id],
      }),
      {}
    )

  const delivery = {
    regions: {},
    countries: {},
  }

  for (const reg in index) {
    delivery.regions[reg] = {
      title: title(reg),
      countries: Object.keys(index[reg].countries),
    }
    for (const c in index[reg].countries) {
      delivery.countries[c] = {
        title: title(c),
        price: index[reg].countries[c]?.price ?? index[reg].price ?? undefined,
        code: index[reg].countries[c]?.code ?? index[reg].countries[c] ?? undefined,
      }
    }
  }

  return delivery
}

async function products() {
  const products = yaml.load(await read('./products/index.yml'))

  for (const id in products) {
    products[id].title = {}
    const files = await fs.readdir(`./products/${id}`)
    for (const f of files) {
      const loc = path.parse(f).name
      const product = front(await read(`./products/${id}/${f}`))
      const { title, subtitle } = product.attributes
      products[id].title = {
        ...products[id].title,
        [loc]: title,
      }
      products[id].subtitle = {
        ...products[id].subtitle,
        [loc]: subtitle,
      }
      products[id].description = {
        ...products[id].description,
        [loc]: product.body,
      }
    }
  }

  return products
}

function read(path) {
  return fs.readFile(path, { encoding: 'utf8' })
}
