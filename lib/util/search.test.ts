import path from 'path'
import Crowi from 'server/crowi'
import { ROOT_DIR } from 'server/test/setup'
import Searcher from 'server/util/search'

describe('Search client', () => {
  const crowi = new Crowi(ROOT_DIR, process.env)
  const searcherUri = 'http://127.0.0.1:19200/crowi'
  const searcher = new Searcher(crowi, searcherUri)

  describe('SearchClient.parseUri', () => {
    test('should return host and indexName', () => {
      let res

      res = searcher.parseUri('http://127.0.0.1:19200/crowi')
      expect(res.host).toBe('http://127.0.0.1:19200')
      expect(res.indexName).toBe('crowi')

      res = searcher.parseUri('https://user:pass@example.com:9200/crowi_search')
      expect(res.host).toBe('https://user:pass@example.com:9200')
      expect(res.indexName).toBe('crowi_search')

      res = searcher.parseUri('http://127.0.0.1:19200')
      expect(res.host).toBe('http://127.0.0.1:19200')
      expect(res.indexName).toBe('crowi')

      // format of docker
      res = searcher.parseUri('http://elasticsearch:9200/')
      expect(res.host).toBe('http://elasticsearch:9200')
      expect(res.indexName).toBe('crowi')
    })
  })

  describe('SearchClient.parseUri error on not start with http', () => {
    expect(() => searcher.parseUri('elasticsearch:9200/')).toThrow(/URL for Elasticsearch should starts with http/)
  })
})
