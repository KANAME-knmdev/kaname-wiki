import Debug from 'debug'
import { v4 as uuid } from 'uuid/v4'
import redis from 'redis'
import Crowi from 'server/crowi'

const debug = Debug('crowi:service:config')

export default class Config {
  crowi: Crowi

  config: any

  pubSub: {
    id: uuid
    publisher: redis.RedisClient | null
    subscriber: redis.RedisClient | null
    channel: string
  }

  constructor(crowi: Crowi) {
    this.crowi = crowi
    this.config = {}

    this.pubSub = {
      id: uuid(),
      publisher: null,
      subscriber: null,
      channel: 'config',
    }

    this.setupPubSub()
  }

  async load() {
    const Config = this.crowi.model('Config')
    const config = await Config.loadAllConfig()
    this.set(config)
  }

  set(config) {
    // FIXME: Deep copy to avoid deleting itself.
    config = JSON.parse(JSON.stringify(config))
    // FIXME: Treat as a mutable object always.
    //        We should always get config using `crowi.getConfig()` *just before* referencing config.
    for (const key of Object.keys(this.config)) {
      delete this.config[key]
    }
    for (const key of Object.keys(config)) {
      this.config[key] = config[key]
    }
  }

  get() {
    return this.config || {}
  }

  notifyUpdated() {
    const { publisher, channel, id } = this.pubSub
    if (publisher) {
      publisher.publish(channel, JSON.stringify({ id }))
    }
  }

  update(config) {
    this.set(config)
    this.notifyUpdated()
  }

  setupPubSub() {
    const { redisOpts } = this.crowi

    if (redisOpts) {
      this.pubSub.publisher = redis.createClient(redisOpts)
      this.pubSub.subscriber = redis.createClient(redisOpts)

      const { pubSub } = this
      const { subscriber } = pubSub

      debug('PubSubId', pubSub.id)

      if (subscriber) {
        subscriber.on('message', async (channel, message) => {
          if (channel !== pubSub.channel) return

          const { id } = JSON.parse(message)
          if (id === pubSub.id) return

          await this.load()

          await Promise.all([this.crowi.setupSlack(), this.crowi.setupMailer()])

          debug(`Config updated by ${pubSub.id}`)
        })

        subscriber.subscribe(pubSub.channel)
      }
    }
  }
}
