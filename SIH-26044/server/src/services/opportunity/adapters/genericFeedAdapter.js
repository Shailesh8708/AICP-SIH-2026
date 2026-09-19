// server/src/services/opportunity/adapters/genericFeedAdapter.js
import { BaseAdapter } from './baseAdapter.js'

export class GenericFeedAdapter extends BaseAdapter {
  constructor() {
    super('generic_feed')
  }

  async fetch(_source) {
    return []
  }
}

export default new GenericFeedAdapter()
